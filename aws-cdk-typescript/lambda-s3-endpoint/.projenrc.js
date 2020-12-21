const { AwsCdkTypeScriptApp } = require('projen');

const project = new AwsCdkTypeScriptApp({
  cdkVersion: "1.79.0",
  name: "lambda-s3-endpoint",
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    'cdk-s3bucket-ng@^1.0.49',
    '@aws-cdk/aws-s3-deployment',
    '@aws-cdk/aws-lambda',
    '@aws-cdk/aws-iam',
  ],
});

project.synth();
