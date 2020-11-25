import * as ec2 from '@aws-cdk/aws-ec2';
import { App, CfnOutput, Construct, Stack, StackProps } from '@aws-cdk/core';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const myvpc = new ec2.Vpc(this, 'myvpc', {
      natGateways: 1,
      cidr: '10.2.0.0/16',
    });
    const instanceSG = new ec2.SecurityGroup(this, 'InstanceSG', {
      vpc: myvpc,
    });
    const userData = ec2.UserData.forLinux();
    userData.addCommands(`
    yum update -y 
    yum install docker -y 
    systemctl start docker 
    systemctl enable docker 
    `);
    const ap1 = new ec2.Instance(this, 'ap1', {
      instanceType: new ec2.InstanceType('t2.micro'),
      vpc: myvpc,
      machineImage: ec2.MachineImage.lookup({
        filters: {
          ['product-code']: ['aw0evgkw8e5c1q413zgy5pjce'],
        },
        name: '*CentOS*',
        owners: ['aws-marketplace'],
      }),
      securityGroup: instanceSG,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      blockDevices: [{
        deviceName: '/dev/sda1',
        volume: ec2.BlockDeviceVolume.ebs(500),
      }],
      userData,
      instanceName: `${id}-Instance`,
    });
    // allow any traffic from slef SG.
    ap1.connections.allowFrom(instanceSG, ec2.Port.allTraffic());

    new CfnOutput(this, 'ap1instancePublicIp', {
      value: ap1.instancePublicIp,
    });
  }
}
// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'devCentos', { env: devEnv });

app.synth();