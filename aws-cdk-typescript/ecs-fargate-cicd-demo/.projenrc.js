const { AwsCdkTypeScriptApp } = require('projen');
const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.121.0',
  defaultReleaseBranch: 'main',
  name: 'ecs-fargate-cicd-demo',
  cdkDependencies: [
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-s3',
    '@aws-cdk/aws-ecs-patterns',
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-ecr',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-codecommit',
    '@aws-cdk/aws-codebuild',
    '@aws-cdk/aws-codedeploy',
    '@aws-cdk/aws-codepipeline',
    '@aws-cdk/aws-ecr-assets',
    '@aws-cdk/aws-codepipeline-actions',
  ],
  deps: [
    'cdk-ecr-deployment',
  ],
});

project.package.addField('resolutions', {
  'vm2': '^3.9.5',
  'pac-resolver': '^5.0.0',
  'ansi-regex': '^6.0.1',
  'tmpl': '^1.0.5',
});
project.synth();
