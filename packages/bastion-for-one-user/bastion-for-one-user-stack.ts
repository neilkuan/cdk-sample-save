import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface BastionForOneUserStackProps extends cdk.StackProps {
  readonly prefix: string;
}

export class BastionForOneUserStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: BastionForOneUserStackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'vpc', {
      natGateways: 1,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          name: 'PrivateSubnet',
        },
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: 'PublicSubnet',
        },
      ],
    });

    const bastionSecurityGroup = new ec2.SecurityGroup(this, `${props?.prefix}-BastionSecurityGroup`, {
      vpc: vpc,
      allowAllOutbound: true,
      description: 'Security group for bastion host',
      securityGroupName: 'BastionSecurityGroup',
    });
    bastionSecurityGroup.connections.allowTo(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Outbound to 443 only');

    const bastion = new ec2.BastionHostLinux(this, `${props?.prefix}-BastionHost`, {
      vpc,
      instanceType: new ec2.InstanceType('t3.micro'),
      securityGroup: bastionSecurityGroup,
      blockDevices: [{
        deviceName: '/dev/sda1',
        volume: ec2.BlockDeviceVolume.ebs(10, {
          encrypted: true,
        }),
      }],
    });
    bastion.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
    const user = new iam.User(this, `${props?.prefix}-User`, {
      userName: `${props?.prefix}-bastion-user`,
    });
    const customPolicySSM = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ssm:StartSession'],
      resources: [`arn:aws:ec2:${this.region}:${this.account}:instance/${bastion.instanceId}`],
    });

    const customPolicyUser = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ssm:TerminateSession'],
      resources: ['arn:aws:ssm:*:*:session/${aws:username}-*'],
    });
    [customPolicySSM, customPolicyUser].forEach(p => {
      user.addToPolicy(p);
    });

    const accessKey = new iam.CfnAccessKey(this, `${props?.prefix}-EC2UserKey`, {
      userName: user.userName,
    });

    new cdk.CfnOutput(this, `${props?.prefix}-serviceAccountKey`, {
      value: accessKey.ref,
      description: 'The service account access key',
      exportName: 'serviceAccountKey',
    });

    new cdk.CfnOutput(this, `${props?.prefix}-serviceAccountSecretKey`, {
      value: accessKey.attrSecretAccessKey,
      description: 'The service account access secret key',
      exportName: 'serviceAccountSecretKey',
    });
  }
}

const app = new cdk.App();
new BastionForOneUserStack(app, 'BastionForOneUserStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  prefix: 'test',
});
