import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

interface StackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  runnerRole: iam.IRole
}

export class MustackStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const vpcS =  new ec2.Vpc(this,'insVpc',{
      cidr: '10.22.0.0/16',
      maxAzs: 3,
      natGateways:1,
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
          subnetType: ec2.SubnetType.PRIVATE,
        },
        {
          cidrMask: 28,
          name: 'rds',
          subnetType: ec2.SubnetType.ISOLATED,
        }
      ]
    });
    const shell = ec2.UserData.forLinux()
    shell.addCommands('yum update -y ',
    'yum install docker -y',
    'systemctl start docker',
    'usermod -aG docker ec2-user',
    'usermod -aG docker ssm-user',
    'chmod +x /var/run/docker.sock',
    'systemctl restart docker && systemctl enable docker',
    'mkdir /home/ec2-user/jenkins-data',
    'docker run -d -u root -p 8080:8080 -p 50000:50000 -v /home/ec2-user/jenkins-data:/var/jenkins_home -v /var/run/docker.sock:/var/run/docker.sock -v /home/ec2-user:/home jenkinsci/blueocean'
    );

    const JSKMaster = new ec2.Instance(this,'EC2',{
      vpc: props?.vpc ?? vpcS,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      },
      instanceType: new ec2.InstanceType('t3.large'),
      instanceName: 'JSKMaster',
      machineImage: ec2.MachineImage.latestAmazonLinux({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
      userData: shell,
      role: props?.runnerRole,
      blockDevices: [({ deviceName: '/dev/xvda', volume: ec2.BlockDeviceVolume.ebs(60) })],
    });

    const eip = new ec2.CfnEIP(this, 'JKSEip',{
      domain: props?.vpc.vpcId,
      instanceId: JSKMaster.instanceId,
      tags: [{
        key: 'Name',
        value: 'JKSMaster-EIP'
      }]
    });

    new cdk.CfnOutput(this, 'JSKEIP',{
      value: eip.ref
    });


    new cdk.CfnOutput(this, 'JSKEC2IP',{
      value: JSKMaster.instancePublicIp
    });


  }
}
