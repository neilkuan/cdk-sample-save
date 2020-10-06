//import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import '@aws-cdk/assert/jest';
import * as cdk from '@aws-cdk/core';
import * as Pro from '../lib/pro-stack';

const devEnv = {
  account: '123456789012',
  region: 'ap-northeast-1',
};


test('Snapshot', () => {
  const app = new cdk.App();
  const stack = new Pro.DemoStack(app, 'testing', {
    env: devEnv,
  } );
  stack.node.setContext('acm', 'arn:aws:acm:ap-northeast-1:123456789012:certificate/6e66e6ee-6f6f-66c6-bb66-66aa6b666666' );
  stack.node.setContext('zoneId', 'Z333333333N3MQFPCC33C' );
  stack.node.setContext('zoneName', 'example.com' );
  expect(stack).not.toHaveResource('AWS::S3::Bucket');
  expect(stack).toHaveResource('AWS::EC2::Instance', {
    BlockDeviceMappings: [
      {
        DeviceName: '/dev/xvda',
        Ebs: {
          VolumeSize: 30,
        },
      },
    ],
  });
  expect(app.synth().getStackArtifact(stack.artifactId).template).toMatchSnapshot();
});

