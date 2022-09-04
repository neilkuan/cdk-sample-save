import {
  App, Stack, StackProps,
  aws_ec2 as ec2,
  aws_ecs as ecs,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const vpc = ec2.Vpc.fromLookup(this, 'VPC', { isDefault: true });
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef');
    taskDefinition.addContainer('web', {
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/nginx/nginx:1.20-arm64v8'),
      portMappings: [{ containerPort: 80 }],
    });
    const cluster = new ecs.Cluster(this, 'Cluster', { vpc, clusterName: 'demoCluster' });
    new ecs.FargateService(this, 'Service', {
      cluster,
      assignPublicIp: true,
      taskDefinition,
    });
    (taskDefinition.node.defaultChild as ecs.CfnTaskDefinition).addPropertyOverride('RuntimePlatform', {
      CpuArchitecture: 'ARM64',
      OperatingSystemFamily: 'LINUX',
    });

  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'arm-dev', { env: devEnv });
// new MyStack(app, 'my-stack-prod', { env: prodEnv });

app.synth();