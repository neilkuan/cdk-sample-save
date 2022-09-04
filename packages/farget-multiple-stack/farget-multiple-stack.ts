import * as cdk from 'aws-cdk-lib';
import { FargetAStack } from './farget-a-stack';
import { FargetBStack } from './farget-b-stack';
import { FargetMultipleStackStack } from './farget-multiple-stack-stack';
const config = {
  region: process.env.CDK_DEFAULT_REGION,
  account: process.env.CDK_DEFAULT_ACCOUNT,
};
const app = new cdk.App();

const F = new FargetMultipleStackStack(app, 'FargetMultipleStack', { env: config });

const Fa = new FargetAStack(app, 'FargetAStack', {
  env: config,
  vpc: F.vpc,
  cluster: F.cluster,
});

const Fb = new FargetBStack(app, 'FargetBStack', {
  env: config,
  vpc: F.vpc,
  cluster: F.cluster,
});

Fa.addDependency(F);
Fb.addDependency(F);
