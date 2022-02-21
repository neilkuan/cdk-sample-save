const { awscdk } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.12.0',
  defaultReleaseBranch: 'main',
  name: 'ecs-arm-instance',
  depsUpgrade: false,
  dependabot: false,
});
project.synth();