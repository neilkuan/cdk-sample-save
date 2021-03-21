import * as ec2 from '@aws-cdk/aws-ec2';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';
import { App, Construct, Stack, StackProps } from '@aws-cdk/core';
import { AwsLoadBalancePolicy, VersionsLists } from 'cdk8s-aws-load-balancer-controller';
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};
export class MyvpcStack extends Stack {
  readonly vpc: ec2.IVpc;
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    this.vpc = new ec2.Vpc(this, 'eksvpc', { natGateways: 1, enableDnsHostnames: true, enableDnsSupport: true });
  }
}
export interface MyeksStackProps extends StackProps {
  readonly vpc: ec2.IVpc;
}

export class MyeksStack extends Stack {
  constructor(scope: Construct, id: string, props: MyeksStackProps) {
    super(scope, id, props);

    const clusterAdmin = new iam.Role(this, 'AdminRole', {
      assumedBy: new iam.AccountRootPrincipal(),
    });

    const eksCluster = new eks.Cluster(this, 'Cluster', {
      vpc: props.vpc,
      mastersRole: clusterAdmin,
      defaultCapacity: 0,
      version: eks.KubernetesVersion.V1_19,
      clusterName: 'eks-create-time-test-cluster',
    });

    const asgspot = eksCluster.addAutoScalingGroupCapacity('ASGSpot', {
      instanceType: new ec2.InstanceType('t3.medium'),
      spotPrice: '0.0544',
      desiredCapacity: 2,
    });
    AwsLoadBalancePolicy.addPolicy(VersionsLists.AWS_LOAD_BALANCER_CONTROLLER_POLICY_V2, asgspot.role);
    eksCluster.awsAuth.addUserMapping(iam.User.fromUserName(this, 'neilguan', 'neilguan'),
      {
        username: 'neilguan',
        groups: ['system:masters'],
      });
  }
}
const app = new App();
const vpcstack = new MyvpcStack(app, 'my-vpc-stack', { env: devEnv });
const eksstack = new MyeksStack(app, 'my-eks-stack', { env: devEnv, vpc: vpcstack.vpc });
eksstack.addDependency(vpcstack);
app.synth();