import * as apprunner from '@aws-cdk/aws-apprunner';
import { App, Construct, Stack, StackProps } from '@aws-cdk/core';

export class AppRunnerStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    new apprunner.CfnService(this, 'pyservice', {
      serviceName: 'cdkPythonService',
      sourceConfiguration: {
        authenticationConfiguration: {
          connectionArn: this.node.tryGetContext('arn'),
        },
        autoDeploymentsEnabled: false,
        codeRepository: {
          codeConfiguration: {
            codeConfigurationValues: {
              buildCommand: 'pip install -r requirements.txt',
              port: '80',
              runtime: 'PYTHON_3',
              runtimeEnvironmentVariables: [{
                name: 'PLATFORM',
                value: 'AWS App Runner',
              }],
              startCommand: 'python app.py',
            },
            configurationSource: 'REPOSITORY',
          },
          repositoryUrl: 'https://github.com/neilkuan/flask-docker-sample',
          sourceCodeVersion: {
            type: 'BRANCH',
            value: 'master',
          },
        },
      },
    });
  }
}


const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new AppRunnerStack(app, 'apprunner-stack', { env: devEnv });

app.synth();