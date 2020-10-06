#!/usr/bin/env node
import { App } from '@aws-cdk/core';
import 'source-map-support/register';
import { DemoStack } from '../lib/pro-stack'
// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();

new DemoStack(app, 'asg-stack-dev', { env: devEnv });
// new MyStack(app, 'my-stack-prod', { env: prodEnv });

app.synth();
