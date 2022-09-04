import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
export class VpcProvider extends cdk.Stack {
  public static createSimple(scope: Construct) {
    const stack = cdk.Stack.of(scope);

    const vpc = stack.node.tryGetContext('use_default_vpc') === '1' ?
      ec2.Vpc.fromLookup(stack, 'Vpc', { isDefault: true }) :
      stack.node.tryGetContext('use_vpc_id') ?
        ec2.Vpc.fromLookup(stack, 'Vpc', { vpcId: stack.node.tryGetContext('use_vpc_id') }) :
        new ec2.Vpc(stack, 'Vpc', { maxAzs: 3, natGateways: 1 });

    return vpc;
  }
}

//
export interface VpcSimpleCreateProps extends cdk.StackProps {
  readonly cidr?: string;
}

export class VpcSimpleCreate extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: VpcSimpleCreateProps) {
    super(scope, id, props);
    new ec2.Vpc(this, 'Vpc', {
      cidr: props.cidr || '10.0.0.0/16',
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          cidrMask: 20,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: 'PrivateSubnet',
          cidrMask: 20,
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
        {
          name: 'IsolatedSubnet',
          cidrMask: 20,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });
  }
}