const { awscdk } = require('projen');

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '1.76.0',
  name: 'testvpceip',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-s3',
    '@aws-cdk/core',
  ],
  defaultReleaseBranch: 'master',
  dependabot: false,
  depsUpgradeOptions: {
    workflow: false,
  },
});

project.synth();
