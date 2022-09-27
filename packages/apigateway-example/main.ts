import * as path from 'path';
import { App, Stack, StackProps, CfnOutput, CfnResource } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdajs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { PrivateApiGateway } from './private-apigateway-with-vpc-endpoint-gateway';
import { PublicApiGateway } from './public-apigateway-with-policy';

export class MyStack extends Stack {
  eips: ec2.CfnEIP[] = [];
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const vpc = new ec2.Vpc(this, 'HttpApiVpc', {
      vpcName: 'HttpApiVpc',
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: 'PrivateNatSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      maxAzs: 3,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    const vpcWithVpcEndpoint = new ec2.Vpc(this, 'VpcWithVpcEndpoint', {
      vpcName: 'VpcWithVpcEndpoint',
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: 'PrivateNatSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      maxAzs: 3,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    vpc.publicSubnets.forEach((publicSubnet, index) => {
      const eip = publicSubnet.node.children.find(c => (c as CfnResource).cfnResourceType === 'AWS::EC2::EIP') as ec2.CfnEIP;
      if (eip) {
        new CfnOutput(this, `eip${index}`, {
          value: `${eip.ref}`,
        });
        this.eips.push(eip);
      }
    });
    const userData = ec2.UserData.forLinux();
    userData.addCommands(...[
      'sudo yum install golang-1.16.15-1.amzn2.0.1.aarch64 -y',
      'git clone https://github.com/rakyll/hey /tmp/hey',
    ]);
    const bastion = new ec2.Instance(this, 'Bastion', {
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        cpuType: ec2.AmazonLinuxCpuType.ARM_64,
      }),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      instanceType: new ec2.InstanceType('t4g.small'),
      vpc,
      userData,
    });

    bastion.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

    const bastionWithVpcEndpoint = new ec2.Instance(this, 'BastionWithVpcEndpoint', {
      machineImage: ec2.MachineImage.latestAmazonLinux({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        cpuType: ec2.AmazonLinuxCpuType.ARM_64,
      }),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      instanceType: new ec2.InstanceType('t4g.small'),
      vpc: vpcWithVpcEndpoint,
      userData,
    });

    bastionWithVpcEndpoint.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));

    const handler = new lambdajs.NodejsFunction(this, 'handler', {
      handler: 'handler',
      entry: path.join(__dirname, './handler/main.ts'),
      runtime: lambda.Runtime.NODEJS_16_X,
    });

    new PrivateApiGateway(this, 'PrivateApiGateway', {
      vpc: vpcWithVpcEndpoint,
      handler: handler,
    });

    new PublicApiGateway(this, 'PublicApiGateway', {
      vpc: vpc,
      handler: handler,
      eips: this.eips,
    });

    new CfnOutput(this, 'demoBastion', {
      value: `aws ssm start-session --target ${bastion.instanceId}`,
    });
    new CfnOutput(this, 'demobastionWithVpcEndpoint', {
      value: `aws ssm start-session --target ${bastionWithVpcEndpoint.instanceId}`,
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new MyStack(app, 'private-apigateway-dev', { env: devEnv });

app.synth();