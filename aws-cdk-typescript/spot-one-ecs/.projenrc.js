const { AwsCdkTypeScriptApp } = require('projen');
const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.111.0',
  defaultReleaseBranch: 'main',
  name: 'spot-one-ecs',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-iam',
  ],
  deps: [
    'cdk-spot-one',
  ],
});
project.synth();