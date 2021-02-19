#!/usr/bin/env python3
#from aws_cdk import core
#from profile_test.profile_test_stack import ProfileTestStack
import os 
from aws_cdk import (
    core as cdk
)

class ProfileTestStack(cdk.Stack):

    def __init__(self, scope: cdk.Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        cdk.CfnOutput(self, 'accountId',value=self.account)
        cdk.CfnOutput(self, 'profile_name',value=self.node.try_get_context('PROFILE'))
aws_account = env = {'account': os.environ['CDK_DEFAULT_ACCOUNT'],
                     'region': os.environ['CDK_DEFAULT_REGION']}
app = cdk.App()
ProfileTestStack(app, "profile-test", env=aws_account)
app.synth()
