import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

interface If extends cdk.StackProps{
  vpc: ec2.IVpc;
  cluster: ecs.ICluster;
}

export class FargetAStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: If) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'MyFargateTaskDefinition', {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    const name = 'microservice-b';

    taskDefinition
      .addContainer(name, {
        image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      })
      .addPortMappings({
        containerPort: 80,
      });
    new ecs.FargateService(this, 'FaS', {
      cluster: props.cluster,
      taskDefinition,
      assignPublicIp: true,
    });
  }
}
