import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class insStack extends cdk.Stack {
  readonly vpc: ec2.IVpc;
  readonly runnerRole: iam.IRole;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.runnerRole = new iam.Role(this, 'JKSEC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [{ managedPolicyArn: 'AmazonSSMManagedInstanceCore' }],
    });

    const eksClusterDescribe = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'eks:DescribeCluster',
      ],
      resources: ['*'],
    });

    this.runnerRole.addToPrincipalPolicy(eksClusterDescribe);

    this.vpc = new ec2.Vpc(this, 'insVpc', {
      cidr: '10.22.0.0/16',
      maxAzs: 3,
      natGateways: 1,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'ingress',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'application',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
        {
          cidrMask: 28,
          name: 'rds',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

  }
}
