import '@aws-cdk/assert/jest';
import { App } from '@aws-cdk/core';
import { MyStack } from '../src/main';

test('Snapshot', () => {
  const app = new App();
  app.node.setContext('rootdomain', 'example.com');
  app.node.setContext('hostedZoneId', 'ZXXXXXXXXXXXXX');
  const stack = new MyStack(app, 'test');

  expect(stack).toHaveResource('AWS::S3::Bucket');
});