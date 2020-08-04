#!/usr/bin/env python3
import os
from aws_cdk import core

from cross_iam.cross_iam_stack import CrossIamStack


app = core.App()
CrossIamStack(app, "cross-iam",env={'account': os.environ['CDK_DEFAULT_ACCOUNT'], 
            'region': os.environ['CDK_DEFAULT_REGION']})

app.synth()
