const { awscdk } = require('projen');

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '1.95.1',
  defaultReleaseBranch: 'main',
  jsiiFqn: 'projen.AwsCdkTypeScriptApp',
  name: 'nodejslambda',
  cdkDependencies: [
    '@aws-cdk/aws-lambda',
    '@aws-cdk/aws-lambda-nodejs',
  ],
  deps: [
    'esbuild',
  ],
  defaultReleaseBranch: 'master',
  dependabot: false,
  depsUpgradeOptions: {
    workflow: false,
  },
});
project.gitignore.exclude(...['.DS_Store', 'cdk.context.json']);
project.synth();
