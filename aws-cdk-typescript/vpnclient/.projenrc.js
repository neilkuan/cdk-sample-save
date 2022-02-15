const { awscdk } = require('projen');

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '1.73.0',
  jsiiFqn: 'projen.AwsCdkTypeScriptApp',
  name: 'vpnclient',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-logs',
  ],
  defaultReleaseBranch: 'master',
  depsUpgrade: false,
  depsUpgradeOptions: {
    workflow: false,
  },
});
const exclude = ['easy-rsa'];
project.gitignore.exclude(...exclude);
project.synth();
