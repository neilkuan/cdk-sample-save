const { AwsCdkTypeScriptApp } = require('projen');

const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.120.0',
  name: 'lambda-s3-endpoint',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-s3-deployment',
    '@aws-cdk/aws-lambda',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-s3',
  ],
  defaultReleaseBranch: 'master',
});
project.package.addField('resolutions', {
  'vm2': '^3.9.5',
  'ws': '7.4.6',
  'hosted-git-info': '2.8.9',
  'lodash': '4.17.21',
  'netmask': '2.0.1',
  'trim-newlines': '3.0.1',
  'y18n': '4.0.1',
  'browserslist': '4.16.5',
  'pac-resolver': '^5.0.0',
  'tar': '6.1.9',
  'tmpl': '^1.0.5',
  'ansi-regex': '^6.0.1',
});
project.synth();
