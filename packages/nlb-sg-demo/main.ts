import { App, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elasticloadbalancingv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';
export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    const vpc = new ec2.Vpc(this, 'newVpc', {
      subnetConfiguration: [{
        subnetType: ec2.SubnetType.PUBLIC,
        name: 'Public',
      }],
      natGateways: 0,
      maxAzs: 2,
    });
    const cluster = new ecs.Cluster(this, 'cluster', {
      vpc,
      clusterName: 'NLB-SG-Cluster',
    });

    const fargateTask = new ecs.FargateTaskDefinition(this, 'fargateTask', {
      cpu: 256,
      memoryLimitMiB: 512,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });
    fargateTask.addContainer('nyancat', {
      portMappings: [{
        containerPort: 80,
      }],
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/pahudnet/nyancat-docker-image:54a3540'),
    });
    const svc = new ecs.FargateService(this, 'Service', {
      serviceName: 'Service',
      taskDefinition: fargateTask,
      cluster,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      platformVersion: ecs.FargatePlatformVersion.LATEST,
      desiredCount: 2,
      /**
       * use default vpc put fargate service in public subnet
       */
      assignPublicIp: true,
    });

    const lb = new elasticloadbalancingv2.NetworkLoadBalancer(this, 'nyancatNlb', {
      vpc, internetFacing: true, crossZoneEnabled: true,
    });
    const ntg80 = lb.addListener('Listener80', { port: 80 });
    ntg80.addTargets('svc80', { port: 80, targets: [svc] });
    const nlbSg = new ec2.SecurityGroup(this, 'NLBSecurityGroup', { vpc, allowAllOutbound: true });
    const cfnlb = (lb.node.defaultChild as elasticloadbalancingv2.CfnLoadBalancer );
    cfnlb.addPropertyOverride('SecurityGroups', [nlbSg.securityGroupId]);
    svc.connections.allowFrom(nlbSg, ec2.Port.tcp(80));
    nlbSg.connections.allowFrom(ec2.Peer.ipv4(this.myIp()), ec2.Port.tcp(80) );

    new CfnOutput(this, 'LB', {
      value: `http://${lb.loadBalancerDnsName}`,
    });

  }
  myIp() :string {
    return '114.24.206.213/32';
  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();
new MyStack(app, 'NLBSGStack', { env: devEnv });
app.synth();