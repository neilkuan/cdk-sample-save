const { AwsCdkConstructLibrary } = require('projen');

const project = new AwsCdkConstructLibrary({
  authorAddress: "guan840912@gmail.com",
  authorName: "Neil Kuan",
  cdkVersion: "1.75.0",
  name: "ecs-sample",
  repository: "https://github.com/guan840912/ecs-sample.git",
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-ecs',
    '@aws-cdk/aws-iam',
    '@aws-cdk/core',
    '@aws-cdk/aws-elasticloadbalancingv2',
    '@aws-cdk/aws-autoscaling'
  ],
});

project.synth();
