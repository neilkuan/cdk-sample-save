#!/usr/bin/env python3
import os
from aws_cdk import core

from s3.s3_stack import S3Stack
aws_account = env = {'account': os.environ['CDK_DEFAULT_ACCOUNT'],
                     'region': os.environ['CDK_DEFAULT_REGION']}

app = core.App()
mys3 = S3Stack(app, "s3", env=aws_account)

# add constants tag {key=Env ,values=Prod }
core.Tag.add(mys3, "Env", "Prod")
core.Tag.add(mys3, "Division", "CT", priority=350)

app.synth()
