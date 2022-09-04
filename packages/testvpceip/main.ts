import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { App, Stack, StackProps, CfnOutput, CfnResource } from 'aws-cdk-lib';
import { Construct } from 'constructs';
export class EipStack extends Stack {
  readonly eipAttrAllocationId: string;
  readonly expoxtEipName: string;
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const eip = new ec2.CfnEIP(this, 'natEip', {
      tags: [{
        key: 'Name',
        value: 'Eip',
      }],
    });
    this.eipAttrAllocationId = eip.attrAllocationId;
    const output = new CfnOutput(this, 'eipA', {
      value: this.eipAttrAllocationId,
      exportName: 'eiplabexportName',
    });
    this.expoxtEipName = `${output.exportName}`;
  }
}

interface MyStackProps extends StackProps {
  expoxtEipName: string;
  eipStackName: string;
  eipAttrAllocationId: string;
}

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: MyStackProps) {
    super(scope, id, props);
    const numberOfAz = 2;
    //const eips: string[] = [];
    const vpc = new ec2.Vpc(this, 'myVpc', {
      maxAzs: numberOfAz,
      natGateways: 1,
    });

    const PublicSubnet1 = vpc.node.findChild('PublicSubnet1') as ec2.IPublicSubnet;
    const natGateway = PublicSubnet1.node.children.find(child =>
      (child as CfnResource).cfnResourceType === 'AWS::EC2::NatGateway') as ec2.CfnNatGateway;
    PublicSubnet1.node.tryRemoveChild('EIP');
    const eip = {
      'Fn::ImportValue': {
        'Fn::Sub': props.expoxtEipName,
      },
    };
    natGateway.addPropertyOverride('AllocationId', eip);
    natGateway.addPropertyDeletionOverride('AllocationId.Fn::GetAtt');
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();
const eipstack =new EipStack(app, 'eipstack', { env: devEnv });

const mystack = new MyStack(app, 'mystack', { env: devEnv, eipStackName: eipstack.stackName, expoxtEipName: eipstack.expoxtEipName, eipAttrAllocationId: eipstack.eipAttrAllocationId });
mystack.addDependency(eipstack);
app.synth();