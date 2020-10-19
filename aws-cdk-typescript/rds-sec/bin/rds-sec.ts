#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { CdkStack } from '../lib/rds-sec-stack';
const env = {
  region: process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_DEFAULT_ACCOUNT,
};
const app = new cdk.App();
const stack = new cdk.Stack(app, 'RdsSecStack', { env });
new CdkStack(stack, 'CdkStack');
app.synth();