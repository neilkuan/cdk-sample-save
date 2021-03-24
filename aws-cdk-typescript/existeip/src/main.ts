import * as ec2 from '@aws-cdk/aws-ec2';
import { App, Construct, Stack, StackProps, CfnOutput } from '@aws-cdk/core';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    // use exist eip allocation id.
    const eip = 'eipalloc-xxxxxxxx';
    const ec2one = new ec2.Instance(this, 'ec2one', {
      machineImage: ec2.MachineImage.latestAmazonLinux( { generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
      vpc: ec2.Vpc.fromLookup(this, 'vpcdef', { isDefault: true }),
      instanceType: new ec2.InstanceType('t3.small'),
    });
    new ec2.CfnEIPAssociation(this, 'eipass', {
      allocationId: eip,
      instanceId: ec2one.instanceId,
    });
    new CfnOutput(this, 'eip', {
      value: ec2one.instancePublicIp,
    });
  }
}
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};
const app = new App();
new MyStack(app, 'exist-eip-dev', { env: devEnv });
app.synth();