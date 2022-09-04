import * as cdk from 'aws-cdk-lib';
import { insStack } from './insvpc';
import { MustackStack } from './mustack-stack';
const app = new cdk.App();
const vpcStack = new insStack(app, 'insStack');
new MustackStack(app, 'MustackStack', {
  vpc: vpcStack.vpc,
  runnerRole: vpcStack.runnerRole,
});
