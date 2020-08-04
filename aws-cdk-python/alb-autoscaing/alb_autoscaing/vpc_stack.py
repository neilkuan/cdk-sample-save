from aws_cdk import (
    core,
    aws_ec2 as ec2,
)


class VpcStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

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
            self, 'eks_vpc',
            cidr='10.1.0.0/16',
            enable_dns_hostnames=True,
            enable_dns_support=True, max_azs=2, nat_gateways=1,
            subnet_configuration=[public_subnet, private_subnet]
        )
