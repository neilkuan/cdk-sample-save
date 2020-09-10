#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { FargetMultipleStackStack } from '../lib/farget-multiple-stack-stack';
import { FargetAStack } from '../lib/farget-a-stack';
import { FargetBStack } from '../lib/farget-b-stack';
const config = {
  region: process.env.CDK_DEFAULT_REGION,
account: process.env.CDK_DEFAULT_ACCOUNT,
};
const app = new cdk.App();

const F = new FargetMultipleStackStack(app, 'FargetMultipleStack',{env:config});

const Fa = new FargetAStack(app, 'FargetAStack',{
  env:config,
  vpc: F.vpc,
  cluster: F.cluster
});

const Fb = new FargetBStack(app, 'FargetBStack',{
  env:config,
  vpc: F.vpc,
  cluster: F.cluster
});

Fa.addDependency(F)
Fb.addDependency(F)
