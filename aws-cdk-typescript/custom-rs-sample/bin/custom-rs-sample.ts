#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CustomRsSampleStack } from '../lib/custom-rs-sample-stack';
const config = {
    region: process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_DEFAULT_ACCOUNT,
  };
const app = new cdk.App();
new CustomRsSampleStack(app, 'CustomRsSampleStack',{env: config});
