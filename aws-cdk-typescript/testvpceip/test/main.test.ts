import '@aws-cdk/assert/jest';
import { App } from '@aws-cdk/core';
import { EipStack } from '../src/main';

test('Snapshot', () => {
  const app = new App();
  const stack = new EipStack(app, 'test');

  expect(stack).not.toHaveResource('AWS::S3::Bucket');
});

