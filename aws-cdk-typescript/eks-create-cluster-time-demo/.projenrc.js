const { AwsCdkTypeScriptApp } = require('projen');

const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.94.0',
  defaultReleaseBranch: 'main',
  jsiiFqn: 'projen.AwsCdkTypeScriptApp',
  name: 'eks-create-cluster-time-demo',
  cdkDependencies: [
    '@aws-cdk/aws-ec2',
    '@aws-cdk/aws-eks',
    '@aws-cdk/aws-iam',
  ],
  deps: [
    'cdk8s-aws-load-balancer-controller',
    'cdk8s',
  ],
});
project.gitignore.exclude(...['cdk.context.json']);
project.synth();
