const { AwsCdkTypeScriptApp } = require('projen');

const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.90.0',
  defaultReleaseBranch: 'main',
  jsiiFqn: 'projen.AwsCdkTypeScriptApp',
  name: 'ecsenv',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-ecs',
  ],
});

project.synth();
