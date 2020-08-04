from aws_cdk import (
    core,
    aws_rds as rds,
    aws_iam as iam,
    aws_ec2 as ec2,
    aws_route53 as r53
)
import random
import string
rdspwd = ''.join(random.choice(string.ascii_letters + string.digits)
                 for x in range(10))


class RdsStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, vpc: ec2.IVpc, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # The code that defines your stack goes here

        demords = rds.DatabaseInstance(
            self, "RDS",
            master_username="admin",
            master_user_password=core.SecretValue.plain_text(rdspwd),
            database_name="db1",
            engine_version="8.0.16",
            delete_automated_backups=True,
            engine=rds.DatabaseInstanceEngine.MYSQL,
            # instance_identifier="cdkdemords2",
            vpc=vpc,
            port=3306,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.SMALL,
            ),
            removal_policy=core.RemovalPolicy.DESTROY,
            deletion_protection=False,
        )

        demords.connections.allow_default_port_from(other=ec2.Peer.ipv4(
            vpc.vpc_cidr_block))

        zone = r53.PrivateHostedZone(
            self, 'cdkdemo-zone', vpc=vpc, zone_name="example.io")

        cname = r53.CnameRecord(self, 'cdk-rds-cname-record', zone=zone, domain_name=demords.db_instance_endpoint_address,
                                record_name="cdkdemo", ttl=core.Duration.minutes(1))
        core.CfnOutput(self, 'rds-passwd', value=rdspwd)
        core.CfnOutput(self, 'rds-host-url',
                       value=demords.db_instance_endpoint_address)
        core.CfnOutput(self, 'rds-cname',
                       value=cname.domain_name)
