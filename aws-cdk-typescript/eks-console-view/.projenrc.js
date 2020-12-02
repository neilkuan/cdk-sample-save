const { AwsCdkTypeScriptApp } = require('projen');

const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.76.0',
  name: 'eks-console-view',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-eks',
    '@aws-cdk/aws-iam',
  ],
  deps: [
    'js-yaml',
    '@types/js-yaml',
    'sync-request',
  ],
});

project.synth();
