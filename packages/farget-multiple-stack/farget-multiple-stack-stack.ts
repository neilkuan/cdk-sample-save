import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

export class FargetMultipleStackStack extends cdk.Stack {
  readonly vpc: ec2.IVpc;
  readonly cluster: ecs.ICluster;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const pubOpt = {
      cidrMask: 26,
      name: 'Public',
      subnetType: ec2.SubnetType.PUBLIC,
    };
    const priOpt = {
      cidrMask: 26,
      name: 'Application1',
      subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
    };
    this.vpc = new ec2.Vpc(this, 'InitVpc', {
      cidr: '172.16.0.0/16',
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [pubOpt, priOpt],
    });

    this.cluster = new ecs.Cluster(this, 'TestEcs', {
      vpc: this.vpc,
    });
  }
}
