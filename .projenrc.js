const { awscdk } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.40.0',
  defaultReleaseBranch: 'main',
  name: 'cdk-sample-save',
  depsUpgradeOptions: {
    workflowOptions: {
      labels: ['auto-approve'],
    },
  },
  autoApproveOptions: {
    secret: 'GITHUB_TOKEN',
    allowedUsernames: ['neilkuan'],
  },
  deps: [
    'cdk-spot-one',
    '@aws-cdk/aws-apigatewayv2-integrations-alpha@2.40.0-alpha.0',
    '@aws-cdk/aws-apigatewayv2-alpha@2.40.0-alpha.0',
    'js-yaml',
    '@types/js-yaml',
    'sync-request',
    'cdk-ecr-deployment@^2.5.5',
  ],
  gitignore: ['cdk.context.json', 'cdk.out', 'easy-rsa'],
  typescriptVersion: '^4.6',
  tsconfigDev: {
    include: ['packages/**/*.ts'],
  },
});
project.synth();
