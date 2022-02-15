const { awscdk } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.1.0',
  defaultReleaseBranch: 'main',
  name: 'ecs-fargate-arm',
});

project.package.addField('resolutions', {
  vm2: '^3.9.6',
});

project.synth();
