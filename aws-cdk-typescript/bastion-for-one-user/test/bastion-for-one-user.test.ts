import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as BastionForOneUser from '../lib/bastion-for-one-user-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new BastionForOneUser.BastionForOneUserStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
