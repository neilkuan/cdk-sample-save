#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { MustackStack } from '../lib/mustack-stack';
import { insStack } from '../lib/insvpc';
const app = new cdk.App();
const vpcStack = new insStack(app, 'insStack');
new MustackStack(app, 'MustackStack',{
    vpc: vpcStack.vpc,
    runnerRole: vpcStack.runnerRole
});
