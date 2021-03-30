const { AwsCdkTypeScriptApp } = require('projen');

const project = new AwsCdkTypeScriptApp({
  cdkVersion: "1.95.1",
  name: "lambda-s3-endpoint",
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-s3-deployment',
    '@aws-cdk/aws-lambda',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-s3',
  ],
  defaultReleaseBranch: 'master',
  devDeps: [
    'netmask',
  ],
});

project.synth();
