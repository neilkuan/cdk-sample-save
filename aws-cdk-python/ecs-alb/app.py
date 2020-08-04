#!/usr/bin/env python3
import os
from aws_cdk import core

from ecs_alb.ecs_alb_stack import EcsAlbStack


app = core.App()
ACCOUNT = app.node.try_get_context('account') or os.environ.get(
    'CDK_DEFAULT_ACCOUNT', 'unknown')
REGION = app.node.try_get_context('region') or os.environ.get(
    'CDK_DEFAULT_REGION', 'unknown')
AWS_ENV = core.Environment(region=REGION, account=ACCOUNT)
EcsAlbStack(app, "ecs-alb",env=AWS_ENV)

app.synth()
