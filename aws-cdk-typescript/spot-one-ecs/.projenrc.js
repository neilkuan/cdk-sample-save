const { awscdk } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '1.111.0',
  defaultReleaseBranch: 'main',
  name: 'spot-one-ecs',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-iam',
  ],
  deps: [
    'cdk-spot-one',
  ],
  defaultReleaseBranch: 'master',
  dependabot: false,
  depsUpgradeOptions: {
    workflow: false,
  },
});
project.synth();