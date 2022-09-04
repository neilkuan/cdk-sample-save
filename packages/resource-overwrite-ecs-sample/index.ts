import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-ecs-integ-ecs');

// Create a cluster
const vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2 });

const cluster = new ecs.Cluster(stack, 'EcsCluster', { vpc });

cluster.addCapacity('DefaultAutoScalingGroup', {
  instanceType: new ec2.InstanceType('t3.samll'),
});
const aa = cluster.node.findChild('DefaultAutoScalingGroup') as autoscaling.AutoScalingGroup;
const lc = aa.node.findChild('LaunchConfig') as autoscaling.CfnLaunchConfiguration;
lc.addPropertyOverride('ImageId', 'ami-034968955444c1fd9');

// Create Task Definition
const taskDefinition = new ecs.Ec2TaskDefinition(stack, 'TaskDef');
const container = taskDefinition.addContainer('web', {
  image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
  memoryLimitMiB: 256,
});

container.addPortMappings({
  containerPort: 80,
  hostPort: 8080,
  protocol: ecs.Protocol.TCP,
});

// Create Service
const service = new ecs.Ec2Service(stack, 'Service', {
  cluster,
  taskDefinition,
});

// Create ALB
const lb = new elbv2.ApplicationLoadBalancer(stack, 'LB', {
  vpc,
  internetFacing: true,
});
const listener = lb.addListener('PublicListener', { port: 80, open: true });

// Attach ALB to ECS Service
listener.addTargets('ECS', {
  port: 80,
  targets: [service.loadBalancerTarget({
    containerName: 'web',
    containerPort: 80,
  })],
  // include health check (default is none)
  healthCheck: {
    interval: cdk.Duration.seconds(60),
    path: '/health',
    timeout: cdk.Duration.seconds(5),
  },
});


new cdk.CfnOutput(stack, 'LoadBalancerDNS', { value: lb.loadBalancerDnsName });

app.synth();