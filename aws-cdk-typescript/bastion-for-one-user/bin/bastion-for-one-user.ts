#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { BastionForOneUserStack } from '../lib/bastion-for-one-user-stack';

const app = new cdk.App();
new BastionForOneUserStack(app, 'BastionForOneUserStack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  prefix: 'test'
});
