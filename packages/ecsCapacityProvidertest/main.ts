import { App, Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';
export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'dvpc', { isDefault: true });
    const ecscluster = new ecs.Cluster(this, 'ecsCapacityProvider', {
      vpc,
      clusterName: 'ecsCapacityProvider',
    });
    const task = new ecs.FargateTaskDefinition(this, 'ecsCapacityProvidertask', { family: 'test' });
    task.addContainer('nginx', { image: ecs.ContainerImage.fromRegistry('public.ecr.aws/nginx/nginx:alpine') });
    new ecs.FargateService(this, 'web', {
      cluster: ecscluster,
      assignPublicIp: true,
      taskDefinition: task,
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 4,
        },
        {
          capacityProvider: 'FARGATE',
          weight: 2,
        },
      ],
      desiredCount: 6,
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'ecsCapacityProvidertest', { env: devEnv });
// new MyStack(app, 'my-stack-prod', { env: prodEnv });

app.synth();