from aws_cdk import (
    core,
    aws_iam as iam
)

accountid = ""
ctrolename = ""


class CrossIamStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # The code that defines your stack goes here
        Crossaccount = iam.Role(self, "Cross-account-Role", role_name=ctrolename,
                                assumed_by=iam.AccountPrincipal(accountid))
        Crossaccount.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("AdministratorAccess"))

        core.CfnOutput(self, 'Switch-Role-Url',
                       value="https://signin.aws.amazon.com/switchrole?roleName="+ctrolename+"&account=" + accountid)
