import * as path from 'path';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as lambda_integ from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { Override } from './override';

export class MyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps = {}) {
    super(scope, id, props);
    const containerHandlerApp = new lambda.DockerImageFunction(this, 'ECRFunctionApp', {
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, './custom-alpine')),
    });
    const customAlpineECR = new lambda.DockerImageFunction(this, 'customAlpineECR', {
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, './custom-alpine')),
    });

    new Override(this, 'Overridehandler', {
      lambdaContainerFunction: customAlpineECR,
      Command: ['app2.handler'],
    });

    const app = new lambda_integ.HttpLambdaIntegration('containerHandlerApp', containerHandlerApp );
    const app2 = new lambda_integ.HttpLambdaIntegration('customAlpineECR', customAlpineECR );
    const api = new apigatewayv2.HttpApi(this, 'HttpApi');
    api.addRoutes({
      path: '/app',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: app,
    });
    api.addRoutes({
      path: '/app2',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: app2,
    });
    new cdk.CfnOutput(this, 'URL', { value: `${api.url!}` });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();

new MyStack(app, 'my-stack-dev', { env: devEnv });

app.synth();