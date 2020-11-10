import * as path from 'path';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as _lambda from '@aws-cdk/aws-lambda';
import * as s3deploy from '@aws-cdk/aws-s3-deployment';
import * as cdk from '@aws-cdk/core';
import * as s3 from 'cdk-s3bucket-ng';


export class Demo extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);
    // new Vpc !!!
    const vpc = new ec2.Vpc(this, 'newVpc', {
      maxAzs: 2,
      natGateways: 1,
    });

    const tests3 = new s3.BucketNg(this, 'testS3', {
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
      code: _lambda.Code.fromAsset(path.join(__dirname, '../fun')),
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

    tests3.grantReadWrite(testlambda);
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