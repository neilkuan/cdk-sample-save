import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda';
import * as logs from '@aws-cdk/aws-logs';
import * as cr from '@aws-cdk/custom-resources';
import * as path from 'path';
export class AwsSamplesCdkK3SStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const k3sBucket = new s3.Bucket(this,'tttt',{
      bucketName: cdk.PhysicalName.GENERATE_IF_NEEDED,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    const onEvent = new lambda.Function(this, 'MyHandler', {
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromAsset(path.join(__dirname, '../custom-resource-handler')),
      handler: 'index.on_event',
    });

    const deleteS3ObjectProvider = new cr.Provider(this, 'MyProvider', {
      onEventHandler: onEvent,
      logRetention: logs.RetentionDays.ONE_DAY,
    });

    const CRdeleteS3ObjectProvider = new cdk.CustomResource(this, 'GetInstanceId', {
      serviceToken: deleteS3ObjectProvider.serviceToken,
      properties: {
        Bucket: k3sBucket.bucketName,
      },
    });

    CRdeleteS3ObjectProvider.node.addDependency(k3sBucket)

    k3sBucket.grantDelete(onEvent);
    k3sBucket.grantReadWrite(onEvent);
  }
}
