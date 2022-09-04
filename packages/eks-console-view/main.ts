import * as fs from 'fs';
import * as path from 'path';
import { App, Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as yaml from 'js-yaml';
export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const vpc = new ec2.Vpc(this, 'eksConsoleViewVpc', {
      natGateways: 1,
      maxAzs: 2,
    });
    const cluster = new eks.Cluster(this, 'eksConsoleView', {
      version: eks.KubernetesVersion.V1_18,
      clusterName: 'eksConsoleView',
      vpc,
    });
    const masterRole = new iam.Role(this, 'newmasterRole', { assumedBy: new iam.AccountRootPrincipal() });
    masterRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'eks:*',
          'ssm:GetParameter',
        ],
        resources: ['*'],
      }),
    );
    const manifest = yaml.loadAll(fs.readFileSync(path.join(__dirname, '../manidest/demo.yaml'), 'utf8')) as Record<string, any>[];
    cluster.addManifest('manidestdemo', ...manifest);
    cluster.awsAuth.addMastersRole(masterRole);
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'my-stack-dev', { env: devEnv });
// new MyStack(app, 'my-stack-prod', { env: prodEnv });

app.synth();