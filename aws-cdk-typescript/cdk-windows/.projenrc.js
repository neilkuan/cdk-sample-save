const { awscdk } = require('projen');

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '1.136.0',
  jsiiFqn: 'projen.AwsCdkTypeScriptApp',
  name: 'cdk-windows',
  defaultReleaseBranch: 'master',
  depsUpgrade: false,
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
  ],
  dependabot: false,
});

project.synth();
