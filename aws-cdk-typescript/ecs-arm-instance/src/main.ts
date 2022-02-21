import { App, Stack, StackProps } from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'publicVpc', {
      natGateways: 0,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: 'pubicName',
          mapPublicIpOnLaunch: true,
        },
      ],
    });
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ASG', {
      vpc,
      // 1 vcpu , 1GB  to demo.
      instanceType: new ec2.InstanceType('t4g.micro'),
      // note !!! find ECS Optimized Image for cpu amr64 architecture.
      machineImage: ecs.EcsOptimizedImage.amazonLinux2( ecs.AmiHardwareType.ARM),
      minCapacity: 0,
      maxCapacity: 100,
      // use spot instance to saving money.
      spotPrice: '0.0336',
      desiredCapacity: 1,
    });
    const ecsC = new ecs.Cluster(this, 'EcsEc2ASGCluster', {
      vpc,
    });
    const capacityProvider = new ecs.AsgCapacityProvider(this, 'AsgCapacityProvider', { autoScalingGroup, capacityProviderName: 'armInstance' });

    ecsC.addAsgCapacityProvider(capacityProvider);

    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'testNginxTD');
    taskDefinition.addContainer('testNginx', {
      // let task desiredCount 2 need 2 nodes.
      cpu: 600,
      memoryReservationMiB: 512,
      memoryLimitMiB: 600,
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/nginx/nginx:1.21-arm64v8'),
    });
    const svc = new ecs.Ec2Service(this, 'arm64nginx', {
      taskDefinition,
      cluster: ecsC,
      desiredCount: 1,
      // use capacity Provider Metrics to control your autoscaling group.
      capacityProviderStrategies: [
        {
          capacityProvider: capacityProvider.capacityProviderName,
          weight: 1,
        },
      ],
    });

    svc.node.addDependency(this.node.tryFindChild('EcsEc2ASGCluster') as ecs.CfnClusterCapacityProviderAssociations);

  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'dev-instance-td', { env: devEnv });
// new MyStack(app, 'my-stack-prod', { env: prodEnv });

app.synth();