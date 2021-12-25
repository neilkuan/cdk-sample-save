#!/usr/bin/env python3
import os

import aws_cdk as cdk

from arm_fargate_stack.arm_fargate_stack import ArmFargateStack

dev_env = cdk.Environment(account=os.getenv('CDK_DEFAULT_ACCOUNT'), region=os.getenv('CDK_DEFAULT_REGION'))
app = cdk.App()
ArmFargateStack(app, "ArmFargateStack", env=dev_env)

app.synth()
