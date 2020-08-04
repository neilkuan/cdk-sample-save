#!/usr/bin/env python3
import os
from aws_cdk import core

from alb_autoscaing.alb_autoscaing_stack import AlbAutoscaingStack
from alb_autoscaing.vpc_stack import VpcStack

aws_account = env = {'account': os.environ['CDK_DEFAULT_ACCOUNT'],
                     'region': os.environ['CDK_DEFAULT_REGION']}
app = core.App()
vpcstack = VpcStack(app, "vpc", env=aws_account)

asg = AlbAutoscaingStack(app, "alb-autoscaing",
                         env=aws_account, vpc=vpcstack.vpc)
asg.add_dependency(vpcstack)

app.synth()
