const { AwsCdkTypeScriptApp } = require('projen');

const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.97.0',
  defaultReleaseBranch: 'main',
  jsiiFqn: 'projen.AwsCdkTypeScriptApp',
  name: 'labapigatewaydomain',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-apigatewayv2',
    '@aws-cdk/aws-route53',
    '@aws-cdk/aws-lambda',
    '@aws-cdk/aws-apigatewayv2-integrations',
    '@aws-cdk/aws-certificatemanager',
  ],
});

project.synth();
