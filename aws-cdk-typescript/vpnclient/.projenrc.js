const { AwsCdkTypeScriptApp } = require('projen');

const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.73.0',
  jsiiFqn: 'projen.AwsCdkTypeScriptApp',
  name: 'vpnclient',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-logs',
  ],
  dependabot: false,
});
const exclude = ['easy-rsa'];
project.gitignore.exclude(...exclude);
project.synth();
