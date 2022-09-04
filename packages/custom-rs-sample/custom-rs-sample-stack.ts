import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Instance, SecurityGroup, Vpc, InstanceType, MachineImage, AmazonLinuxGeneration } from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

export class CustomRsSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const vpc = Vpc.fromLookup(this, 'DefaultVPC', {
      isDefault: true,
    });

    const SG = new SecurityGroup(this, 'SG', {
      securityGroupName: 'TEST-CUSTOM-RS-SG',
      vpc,

    });

    const imageId = MachineImage.latestAmazonLinux({ generation: AmazonLinuxGeneration.AMAZON_LINUX_2 });

    new Instance(this, 'RS-Instance', {
      vpc,
      instanceType: new InstanceType('t2.small'),
      machineImage: imageId,
      securityGroup: SG,
    });

    const onEvent = new lambda.Function(this, 'OnEvent', {
      code: lambda.Code.fromAsset(path.join(__dirname, './')),
      handler: 'index.on_event',
      runtime: lambda.Runtime.PYTHON_3_8,
      timeout: cdk.Duration.seconds(60),
    });

    const isComplete = new lambda.Function(this, 'IsComplete', {
      code: lambda.Code.fromAsset(path.join(__dirname, './')),
      handler: 'index.is_complete',
      runtime: lambda.Runtime.PYTHON_3_8,
      timeout: cdk.Duration.seconds(60),
      role: onEvent.role,
    });

    const myProvider = new cr.Provider(this, 'MyProvider', {
      onEventHandler: onEvent,
      isCompleteHandler: isComplete,
      logRetention: logs.RetentionDays.ONE_DAY,
    });

    onEvent.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ec2:DescribeSpotFleetInstances',
        'ec2:AuthorizeSecurityGroupIngress'],
      resources: ['*'],
    }));

    new cdk.CustomResource(this, 'ModifySG', {
      serviceToken: myProvider.serviceToken,
      properties: {
        SGId: SG.securityGroupId,
        myIp: '51.111.99.233',
      },
    });


  }
}


const config = {
  region: process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_DEFAULT_ACCOUNT,
};
const app = new cdk.App();
new CustomRsSampleStack(app, 'CustomRsSampleStack', { env: config });
