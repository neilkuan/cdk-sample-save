const { awscdk } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '1.101.0',
  defaultReleaseBranch: 'main',
  name: 'step-function-sample',
  cdkDependencies: [
    '@aws-cdk/aws-lambda',
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-stepfunctions',
    '@aws-cdk/aws-stepfunctions-tasks',
    '@aws-cdk/aws-events-targets',
    '@aws-cdk/aws-events',
    '@aws-cdk/aws-lambda-nodejs',
  ],
  defaultReleaseBranch: 'master',
  dependabot: false,
  depsUpgradeOptions: {
    workflow: false,
  },
});
project.synth();