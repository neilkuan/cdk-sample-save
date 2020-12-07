import * as path from 'path';
import * as apigatewayv2 from '@aws-cdk/aws-apigatewayv2';
import * as _lambda_integ from '@aws-cdk/aws-apigatewayv2-integrations';
import * as _lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { Override } from './override';

export class MyStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps = {}) {
    super(scope, id, props);
    const containerHandlerApp = new _lambda.DockerImageFunction(this, 'ECRFunctionApp', {
      code: _lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../custom-alpine')),
    });
    const customAlpineECR = new _lambda.DockerImageFunction(this, 'customAlpineECR', {
      code: _lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../custom-alpine')),
    });

    new Override(this, 'Overridehandler', {
      lambdaContainerFunction: customAlpineECR,
      Command: ['app2.handler'],
    });

    const app = new _lambda_integ.LambdaProxyIntegration({ handler: containerHandlerApp });
    const app2 = new _lambda_integ.LambdaProxyIntegration({ handler: customAlpineECR });
    const api = new apigatewayv2.HttpApi(this, 'API');
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