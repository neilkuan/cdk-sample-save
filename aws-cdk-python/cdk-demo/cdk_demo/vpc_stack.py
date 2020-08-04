from aws_cdk import (
    core,
    aws_ec2 as ec2,
    aws_iam as iam
)


class VpcStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # The code that defines your stack goes here
        public_subnet = ec2.SubnetConfiguration(
            cidr_mask=20,
            name='Ingress',
            subnet_type=ec2.SubnetType.PUBLIC
        )

        private_subnet = ec2.SubnetConfiguration(
            cidr_mask=20,
            name='Application',
            subnet_type=ec2.SubnetType.PRIVATE
        )

        self.vpc = ec2.Vpc(
            self, 'vpc',
            cidr='10.1.0.0/16',
            max_azs=2,
            subnet_configuration=[public_subnet, private_subnet]
        )

        eks_describecluster_policy = iam.PolicyStatement(effect=iam.Effect.ALLOW,
                                                         actions=[
                                                             "eks:DescribeCluster"
                                                         ],
                                                         resources=["*"]
                                                         )
        self.runnerrole = iam.Role(
            self, "Runner-Role", assumed_by=iam.ServicePrincipal('ec2.amazonaws.com'),
            managed_policies=[iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")])
        self.runnerrole.add_to_principal_policy(eks_describecluster_policy)
