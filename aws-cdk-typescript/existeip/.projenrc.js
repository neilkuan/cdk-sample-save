const { AwsCdkTypeScriptApp } = require('projen');

const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.94.1',
  defaultReleaseBranch: 'main',
  jsiiFqn: 'projen.AwsCdkTypeScriptApp',
  name: 'existeip',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
  ],
});

project.synth();
