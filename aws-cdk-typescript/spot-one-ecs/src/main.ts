import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import { App, Construct, Stack, StackProps, CfnOutput } from '@aws-cdk/core';
import { SpotInstance } from 'cdk-spot-one';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const vpc = ec2.Vpc.fromLookup(this, 'defVpc', { isDefault: true });
    const ecscluster = new ecs.Cluster(this, 'spotOneCluster', {
      vpc,
    });
    const spotInstanceRole = new iam.Role(this, 'spotInstanceRole', { assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com') });
    spotInstanceRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    spotInstanceRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonEC2ContainerServiceforEC2Role'));

    const node = new SpotInstance(this, 'spotInstanceEcsDataplane', {
      vpc,
      ebsVolumeSize: 30,
      instanceProfile: new iam.CfnInstanceProfile(this, 'spotinstaceprofile', { roles: [spotInstanceRole.roleName] }),
      defaultInstanceType: new ec2.InstanceType('t3.small'),
      customAmiId: ecs.EcsOptimizedImage.amazonLinux2().getImage(this).imageId,
      additionalUserData: [
        `echo ECS_CLUSTER=${ecscluster.clusterName} >> /etc/ecs/ecs.config`,
        'echo ECS_ENABLE_SPOT_INSTANCE_DRAINING=true >> /etc/ecs/ecs.config',
      ],
    });

    new CfnOutput(this, 'insatnceId', {
      value: node.instanceId!,
    });
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'spot-one-register-ecs-dev', { env: devEnv });
// new MyStack(app, 'my-stack-prod', { env: prodEnv });

app.synth();