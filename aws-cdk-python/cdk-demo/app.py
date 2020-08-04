#!/usr/bin/env python3

from aws_cdk import core
from cdk_demo.cdk_demo_stack import CdkDemoStack
from cdk_demo.rds_stack import RdsStack
from cdk_demo.vpc_stack import VpcStack
from cdk_demo.runner_stack import RunnerStack
from cdk_demo.kns_stack import KnsStack
import os

aws_account = {'account': os.environ['CDK_DEFAULT_ACCOUNT'],
               'region': os.environ['CDK_DEFAULT_REGION']}

app = core.App()
vpc_stack = VpcStack(app, "vpc-cdk-demo", env=aws_account)

rds_stack = RdsStack(app, "rds-cdk-demo", env=aws_account, vpc=vpc_stack.vpc)

runner_stack = RunnerStack(app, "runner-cdk-demo",
                           env=aws_account, vpc=vpc_stack.vpc, runnerrole=vpc_stack.runnerrole)

eks_stack = CdkDemoStack(
    app, "eks-cdk-demo", env=aws_account, vpc=vpc_stack.vpc, runnerrole=vpc_stack.runnerrole)

runner_stack.add_dependency(vpc_stack)
rds_stack.add_dependency(vpc_stack)


app.synth()
