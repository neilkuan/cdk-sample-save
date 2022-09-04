import { App, Stack, StackProps, CfnOutput, Duration, Fn } from 'aws-cdk-lib';
import * as asing from 'aws-cdk-lib/aws-autoscaling';
import * as certmgr from 'aws-cdk-lib/aws-certificatemanager';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as r53 from 'aws-cdk-lib/aws-route53';
import * as r53tg from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

interface DemoStackProps extends StackProps {
  zoneId?: string;
  zoneName?: string;
  acm?: string;
  lookup?: boolean;
}
export class DemoStack extends Stack {
  lookup?: boolean;
  constructor(scope: Construct, id: string, props: DemoStackProps) {
    super(scope, id, props);

    this.lookup = props.lookup;
    const userData = ec2.UserData.forLinux();
    userData.addCommands(`
set -xe
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1
yum update -y
yum install docker -y
systemctl start docker
systemctl enable docker
sleep 5
docker run -d -p 80:80 guanyebo/demohttpd:v1
systemctl status amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl restart amazon-ssm-agent
exit 0`);
    // new vpc for this demo.
    const vpc = new ec2.Vpc(this, 'newVpc', {
      maxAzs: 2,
      natGateways: 1,
    });
    // find exist acm from my account.
    const acm = certmgr.Certificate.fromCertificateArn(this, 'demoAcm', props?.acm ?? `${this.node.tryGetContext('acm')}`);
    // create a new alb for this asg.
    const alb = new elb.ApplicationLoadBalancer(this, 'myalb', {
      vpc,
      internetFacing: true,
      loadBalancerName: 'demoalb',
    });
    // use lanuch template for replace asg lanuch configure.
    const asg = new asing.AutoScalingGroup(this, 'webASG', {
      vpc,
      instanceType: new ec2.InstanceType('t3.micro'),
      machineImage: ec2.MachineImage.latestAmazonLinux(
        { generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
      desiredCapacity: 3,
      spotPrice: '0.0104',
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: asing.BlockDeviceVolume.ebs(30),
        },
      ],
      userData,
    });
    // create instance profile for lanuch template.
    const instanceProfile = new iam.CfnInstanceProfile(this, 'InstanceProfile', {
      roles: [asg.role.roleName],
    });
    // use lanuch template for replace asg lanuch configure.
    const lt = new ec2.CfnLaunchTemplate(this, 'GitlabRunnerLaunchTemplate', {
      launchTemplateData: {
        imageId: ec2.MachineImage.latestAmazonLinux({
          generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        }).getImage(this).imageId,
        instanceType: 't3.medium',
        instanceMarketOptions: {
          marketType: 'spot',
          spotOptions: {
            spotInstanceType: 'one-time',
          },
        },
        userData: Fn.base64(userData.render()),
        blockDeviceMappings: [
          {
            deviceName: '/dev/xvda',
            ebs: {
              volumeSize: 30,
            },
          },
        ],
        iamInstanceProfile: {
          arn: instanceProfile.attrArn,
        },
        securityGroupIds: asg.connections.securityGroups.map(
          (m) => m.securityGroupId,
        ),
      },
    });
    // find L1 Cfn asg construct resource in ASG use lanuch template replace it.
    const cfnAsg = asg.node.tryFindChild('ASG') as asing.CfnAutoScalingGroup;
    cfnAsg.addPropertyDeletionOverride('LaunchConfigurationName');
    cfnAsg.addPropertyOverride('LaunchTemplate', {
      LaunchTemplateId: lt.ref,
      Version: lt.attrLatestVersionNumber,
    });
    // remove LaunchConfig from asg.
    asg.node.tryRemoveChild('LaunchConfig');
    // add some policy to asg iam role
    asg.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'ssmmessages:*',
          'ssm:UpdateInstanceInformation',
          'ec2messages:*',
        ],
        resources: ['*'],
      }));
    // add inbound from alb SG to asg SG.
    asg.connections.allowFrom( alb.connections, ec2.Port.tcp(80));
    // add listener and redirect action for asg .
    alb.addListener('myWebhttp', {
      port: 80,
      open: true,
      defaultAction: elb.ListenerAction.redirect( {
        protocol: 'HTTPS',
        host: '#{host}',
        path: '/#{path}',
        query: '/#{query}',
        port: '443',
      }),
    });
    const httpslistener = alb.addListener('myWebhttps', {
      certificates: [acm],
      port: 443,
      open: true,
    });
    httpslistener.addTargets('webServer', {
      port: 80,
      targets: [asg],
    });
    // find r53 zone.
    if (this.lookup) {
      const zone = r53.HostedZone.fromHostedZoneAttributes(this, 'myZone', {
        hostedZoneId: props?.zoneId ?? this.node.tryGetContext('zoneId'),
        zoneName: props?.zoneName ?? this.node.tryGetContext('zoneName'),
      });
      const r53alias = new r53.ARecord(this, 'alias-alb', {
        zone,
        target: r53.RecordTarget.fromAlias(new r53tg.LoadBalancerTarget(alb)),
        recordName: 'cdkdemo',
        ttl: Duration.minutes(5),
      });
      new CfnOutput(this, 'aliasalbOutput', {
        value: r53alias.domainName,
      });
    } else {

      return;
    }

  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new DemoStack(app, 'asg-stack-dev', { env: devEnv });

app.synth();
