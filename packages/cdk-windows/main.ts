import { App, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const vpc = ec2.Vpc.fromLookup(this, 'defaultVpc', {
      isDefault: true,
    });
    const windows = new ec2.Instance(this, 'windowsEC2', {
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      machineImage: ec2.MachineImage.latestWindows(ec2.WindowsVersion.WINDOWS_SERVER_2019_ENGLISH_FULL_BASE),
      instanceType: new ec2.InstanceType('t3.medium'),
      blockDevices: [{
        deviceName: '/dev/sda1',
        volume: ec2.BlockDeviceVolume.ebs(50),
      }],
      keyName: 'eksworker',
    });
    windows.connections.allowFrom(ec2.Peer.ipv4(`${process.env.MYIP}/32`), ec2.Port.tcp(3389));
    new CfnOutput(this, 'InstanceId', {
      value: windows.instanceId,
    });
    new CfnOutput(this, 'Get Password word', {
      value: `aws ec2 get-password-data --instance-id ${windows.instanceId} --priv-launch-key ${windows.instance.keyName}.pem`,
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'windowsEC2', { env: devEnv });

app.synth();