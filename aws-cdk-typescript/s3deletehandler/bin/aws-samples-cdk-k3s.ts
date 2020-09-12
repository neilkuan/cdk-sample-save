#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
//import * as ec2 from '@aws-cdk/aws-ec2';
//import * as k3s from 'cdk-k3s-cluster';
import {AwsSamplesCdkK3SStack} from '../lib/aws-samples-cdk-k3s-stack';

const app = new cdk.App();
const env = {
  region: app.node.tryGetContext('region') || process.env.CDK_INTEG_REGION || process.env.CDK_DEFAULT_REGION,
  account: app.node.tryGetContext('account') || process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT
};
new AwsSamplesCdkK3SStack(app, 'S3Test', {env})
//const stack = new cdk.Stack(app, 'k8sCluster', { env })
// 
//new k3s.Cluster(stack, 'Cluster', {
//  vpc: k3s.VpcProvider.getOrCreate(stack),
//  spotWorkerNodes: true,
//  workerMinCapacity: 1,
//  workerInstanceType: new ec2.InstanceType('m6g.medium'),
//  controlPlaneInstanceType: new ec2.InstanceType('m6g.medium')
//})
