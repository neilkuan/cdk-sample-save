import { App, Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const vpc = ec2.Vpc.fromLookup(this, 'defaultVPC', { isDefault: true });
    const cluster = new ecs.Cluster(this, 'ecscluster', { vpc, clusterName: 'logCluster' });
    const nginxlogs = new logs.LogGroup(this, 'nginxlogs', {
      logGroupName: 'nginxlogs',
      retention: logs.RetentionDays.ONE_DAY,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'logtestdef');
    taskDefinition.addContainer('nginx', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/nginx/nginx:stable'),
      essential: true,
      logging: new ecs.AwsLogDriver({
        logGroup: nginxlogs,
        streamPrefix: 'nginx',
      }),
    });
    new ecs.FargateService(this, 'logtest', {
      assignPublicIp: true,
      cluster,
      taskDefinition,
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'logdev', { env: devEnv });
// new MyStack(app, 'my-stack-prod', { env: prodEnv });

app.synth();