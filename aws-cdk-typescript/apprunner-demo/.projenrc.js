const { AwsCdkTypeScriptApp } = require('projen');
const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.115.0',
  defaultReleaseBranch: 'main',
  name: 'apprunner-demo',
  cdkDependencies: [
    '@aws-cdk/aws-apprunner',
  ],
});
project.synth();