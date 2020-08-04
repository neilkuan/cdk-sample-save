from json import load
import pip._vendor.requests as requests
from aws_cdk import (
    core,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_route53 as r53
)
# this ami for ap-northeats-1 region .
# amzn-ami-hvm-2016.09.0.20160923-x86_64-gp2

# find your computer public ip .
external_ip = requests.get('https://checkip.amazonaws.com').text.rstrip()

# need to change your host_zone .
my_hosted_zone = "ZZZZZZZZ_HOST_ZONE_ID"

# need to change your zone_name .
my_zone_name = "ROUTE53_DOMAIN_ID"

# this is your computer public ip .
your_public_ip = str(external_ip + "/32")

# need to change your ec2 key_pair
my_key_pair = "eksworker"

with open("./user_data/user_data_system_manager.sh") as f:
    userdata = f.read()


class VpcStack(core.Stack):
    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # The code that defines your stack goes here

        # vpc = ec2.Vpc.from_lookup(self,'vpc',vpc_name="eksctl-Cloudteam-cluster/VPC" )
        prj_name = self.node.try_get_context("token")
        shellCommands = ec2.UserData.for_linux()
        shellCommands.add_commands("yum update -y")
        shellCommands.add_commands("yum install docker -y")
        shellCommands.add_commands("usermod -aG dokcer ec2-user")
        shellCommands.add_commands("systemctl start docker")
        shellCommands.add_commands("systemctl enable docker")
        shellCommands.add_commands(
            "docker run -d -v /home/ec2-user/.gitlab-runner:/etc/gitlab-runner -v /var/run/docker.sock:/var/run/docker.sock --name gitlab-runner-register gitlab/gitlab-runner:alpine register --non-interactive --url https://gitlab.com./ --registration-token " + prj_name + " --docker-volumes \"/var/run/docker.sock:/var/run/docker.sock\" --executor docker --docker-image \"alpine:latest\" --description \"Docker Runner\" --tag-list \"demo,runner,cdk\" --docker-privileged")
        shellCommands.add_commands(
            "sleep 2 && docker run -d -v /home/ec2-user/.gitlab-runner:/etc/gitlab-runner -v /var/run/docker.sock:/var/run/docker.sock --name gitlab-runner gitlab/gitlab-runner:alpine")
        vpc = ec2.Vpc.from_lookup(self, 'vpc', is_default=True)
        newSG = ec2.SecurityGroup(self, 'Webec2SG', vpc=vpc, security_group_name="Webec2SG",
                                  description="for aws cdk python lab create webec2 SG")

        newSG.add_ingress_rule(peer=ec2.Peer.ipv4(
            your_public_ip), connection=ec2.Port.tcp(22))
        newSG.add_ingress_rule(peer=ec2.Peer.any_ipv4(),
                               connection=ec2.Port.tcp(80))
        newSG.add_ingress_rule(peer=ec2.Peer.any_ipv4(),
                               connection=ec2.Port.tcp(443))

        # aws linux 2
        # newec2 = ec2.Instance(self, 'webec2', instance_type=ec2.InstanceType(instance_type_identifier="t2.micro"), instance_name='webec2', vpc=vpc, security_group=newSG,
        #                      key_name=my_key_pair, machine_image=ec2.LookupMachineImage(name="amzn2-ami-hvm-2.0.20200406.0-x86_64-gp2", user_data=ec2.UserData.custom(userdata)))
        newec2 = ec2.Instance(self, 'webec2', instance_type=ec2.InstanceType(instance_type_identifier="t2.micro"), instance_name='webec2', vpc=vpc, security_group=newSG,
                              key_name=my_key_pair, machine_image=ec2.LookupMachineImage(name="amzn2-ami-hvm-2.0.20200406.0-x86_64-gp2",
                                                                                         user_data=shellCommands))

        # ubuntu 16.04
        # newec2 = ec2.Instance(self, 'webec2', instance_type=ec2.InstanceType(instance_type_identifier="t2.micro"), instance_name='webec2', vpc=vpc, security_group=newSG,
        #                      key_name=my_key_pair, machine_image=ec2.LookupMachineImage(name="ubuntu/images/hvm-ssd/ubuntu-xenial-16.04-amd64-server-20200407", user_data=ec2.UserData.custom(userdata)))
        newec2.role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore"))

        neweip = ec2.CfnEIP(self, "EIP", domain=vpc.vpc_id, tags=[core.CfnTag(
            key="Name", value="WEBEC2EIP")], instance_id=newec2.instance_id)

        # search my route53 HostedZone.

        zone = r53.HostedZone.from_hosted_zone_attributes(
            self, 'MYHOSTED_ZONE', hosted_zone_id=my_hosted_zone, zone_name=my_zone_name)

        # target neweip .
        newdomain = r53.ARecord(self, "Route53NewArecord", zone=zone,
                                target=r53.RecordTarget.from_ip_addresses(neweip.ref), record_name="cdk-demo", ttl=core.Duration.minutes(5))

        core.CfnOutput(self, 'domainname', value=newdomain.domain_name)
        core.CfnOutput(self, 'hosted_zone', value=zone.zone_name)
        core.CfnOutput(self, 'ec2-public-ip',
                       value=newec2.instance_public_dns_name)
        core.CfnOutput(self, 'vpc-id', value=vpc.vpc_id)
        core.CfnOutput(self, 'sg-id', value=newSG.security_group_id)
        core.CfnOutput(self, 'instance-id', value=newec2.instance_id)
        core.CfnOutput(self, 'local-az',
                       value=newec2.instance.availability_zone)
        core.CfnOutput(self, 'subnet-id', value=newec2.instance.subnet_id)
        core.CfnOutput(self, 'region', value=self.region)
