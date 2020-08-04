#!/usr/bin/env python3

from aws_cdk import core
import os
from vpc.vpc_stack import VpcStack

app = core.App()
VpcStack(app, "vpc", env={'account': os.environ['CDK_DEFAULT_ACCOUNT'],
                          'region': os.environ['CDK_DEFAULT_REGION']})

app.synth()
