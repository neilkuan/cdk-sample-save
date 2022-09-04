import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as Pro from '../../packages/spot-asg-web/pro-stack';

const devEnv = {
  account: '123456789012',
  region: 'ap-northeast-1',
};


test('Snapshot', () => {
  const app = new cdk.App();
  const stack = new Pro.DemoStack(app, 'testing', {
    env: devEnv,
    lookup: false,
  } );
  Template.fromStack(stack).findResources('AWS::S3::Bucket');
  Template.fromStack(stack).findResources('AWS::EC2::Instance');
});

