
        
from aws_cdk import (
    core as cdk
)


class ProfileTestStack(cdk.Stack):

    def __init__(self, scope: cdk.Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        cdk.CfnOutput(self, 'accountId',
                       value=self.account)