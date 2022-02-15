const { awscdk } = require('projen');

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '1.76.0',
  name: 'lambda-container',
  cdkDependencies: [
    '@aws-cdk/aws-lambda',
    '@aws-cdk/aws-ecr',
    '@aws-cdk/aws-apigatewayv2',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-apigatewayv2-integrations',
    '@aws-cdk/aws-logs',
  ],
  defaultReleaseBranch: 'master',
  dependabot: false,
  depsUpgradeOptions: {
    workflow: false,
  },
});
const common_exclude = ['cdk.out', 'cdk.context.json', 'image', 'yarn-error.log', 'coverage', 'venv'];
project.gitignore.exclude(...common_exclude);

project.synth();