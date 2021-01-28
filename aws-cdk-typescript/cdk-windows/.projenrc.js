const { AwsCdkTypeScriptApp } = require('projen');

const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.73.0',
  jsiiFqn: 'projen.AwsCdkTypeScriptApp',
  name: 'cdk-windows',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
  ],
  dependabot: false,
});

project.synth();
