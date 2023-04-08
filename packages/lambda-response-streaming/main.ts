import * as path from 'path';
import { Stack, App, CfnOutput, StackProps, Duration } from 'aws-cdk-lib';
import { FunctionUrlAuthType, Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
const app = new App();
export class LambdaResponseStreaming extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {} ) {
    super(scope, id, props);
    const fn = new NodejsFunction(this, 'DemoFunction', {
      functionName: 'DemoFunction',
      architecture: Architecture.ARM_64,
      handler: 'index.handler',
      runtime: Runtime.NODEJS_18_X,
      timeout: Duration.minutes(1),
      entry: path.join(__dirname, './lambda/index.js'),
      bundling: {
        forceDockerBundling: false,
      },
    });
    const fnUrl = fn.addFunctionUrl({ authType: FunctionUrlAuthType.AWS_IAM });
    new CfnOutput(this, 'Url', { value: fnUrl.url });
  }
}


new LambdaResponseStreaming(app, 'LambdaResponseStreaming', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});