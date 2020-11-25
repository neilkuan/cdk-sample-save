const { AwsCdkTypeScriptApp } = require('projen');

const project = new AwsCdkTypeScriptApp({
  cdkVersion: "1.74.0",
  name: "inspoc",
  cdkDependencies: [
    '@aws-cdk/aws-ec2'],
  dependabot: false,
  mergify: false,
  
});

project.synth();
