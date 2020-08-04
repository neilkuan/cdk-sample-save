#!/usr/bin/env python3

from aws_cdk import core
import os 
from cdk.cdk_stack import CdkStack


app = core.App()
CdkStack(app, "cdk",
         env={'account': os.environ['CDK_DEFAULT_ACCOUNT'], 
            'region': os.environ['CDK_DEFAULT_REGION']})

app.synth()
