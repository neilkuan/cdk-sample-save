import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as _lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';

export class Demo extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);
    // new Vpc !!!
    const vpc = new ec2.Vpc(this, 'newVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    const tests3 = new s3.Bucket(this, 'testS3', {
      bucketName: 'neiltests3',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new s3deploy.BucketDeployment(this, 'BucketDeploymentaa', {
      sources: [s3deploy.Source.asset('./privates3')],
      destinationBucket: tests3,
    });

    const testlambda = new _lambda.Function(this, 'testlambda', {
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      allowPublicSubnet: true,
      runtime: _lambda.Runtime.PYTHON_3_8,
      code: _lambda.Code.fromAsset(path.join(__dirname, './fun')),
      handler: 'index.lambda_handler',
      environment: {
        s3bucketname: tests3.bucketName,
      },
    });
    // lambda in private subnet via nat to internet.
    //const testlambda = new _lambda.Function(this, 'testlambda', {
    //  vpc: vpc,
    //  runtime: _lambda.Runtime.PYTHON_3_8,
    //  code: _lambda.Code.fromAsset(path.join(__dirname, '../fun')),
    //  handler: 'index.lambda_handler',
    //  environment: {
    //    s3bucketname: tests3.bucketName,
    //  },
    //});

    testlambda.role?.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'));
    const s3Endpoint =vpc.addGatewayEndpoint('s3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    s3Endpoint.addToPolicy(
      new iam.PolicyStatement({
        principals: [new iam.AnyPrincipal()],
        actions: ['*'],
        resources: ['*'],
      }),
    );
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();
const stack = new cdk.Stack(app, 'DemoStack', { env: devEnv });
new Demo(stack, 's3test');

app.synth();