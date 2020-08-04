from aws_cdk import (
    core,
    aws_autoscaling as asc,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elb,
    aws_route53 as r53,
    aws_route53_targets as r53tg,
    aws_certificatemanager as acm,
    aws_iam as iam


)
# need to change your host_zone .
my_hosted_zone = ""

# need to change your zone_name .
my_zone_name = ""
ec2_type = "t2.micro"
# need to change your ec2 key_pair
my_key_pair = ""
cloudacm = ''
with open("./user_data/user_data_system_manager.sh") as f:
    us = f.read()


class AlbAutoscaingStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, vpc: ec2.IVpc, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # The code that defines your stack goes here
        core.CfnOutput(self, "vpc-id", value=vpc.vpc_id)
        myacm = acm.Certificate.from_certificate_arn(
            self, 'MYACM', cloudacm)
        alb = elb.ApplicationLoadBalancer(self, "myalb",
                                          vpc=vpc,
                                          internet_facing=True,
                                          load_balancer_name="myalb"
                                          )
        alb.connections.allow_from_any_ipv4(
            ec2.Port.tcp(80), "Internet access ALB 80")
        listener = alb.add_listener("my80",
                                    port=80,
                                    open=True,
                                    default_action=elb.ListenerAction(action_json={
                                        "type": "redirect",
                                        "redirectConfig": {
                                            "protocol": "HTTPS",
                                            "host": "#{host}",
                                            "path": "/#{path}",
                                            "query": "#{query}",
                                            "port": "443",
                                            "statusCode": "HTTP_301"
                                        }
                                    }
                                    ))
        alb.connections.allow_from_any_ipv4(
            ec2.Port.tcp(443), "Internet access ALB 443")
        listener = alb.add_listener("my443",
                                    port=443,
                                    open=True, certificates=[myacm])

        # Create Autoscaling Group with fixed 2*EC2 hosts
        self.asc = asc.AutoScalingGroup(self, "myASG",
                                        vpc=vpc,
                                        vpc_subnets=ec2.SubnetSelection(
                                            subnet_type=ec2.SubnetType.PRIVATE),
                                        instance_type=ec2.InstanceType(
                                            instance_type_identifier=ec2_type),
                                        machine_image=ec2.LookupMachineImage(
                                            name="amzn2-ami-hvm-2.0.20200406.0-x86_64-gp2"),
                                        key_name=my_key_pair,
                                        user_data=ec2.UserData.custom(
                                            us),
                                        desired_capacity=1,
                                        min_capacity=1,
                                        max_capacity=5,
                                        # block_devices=[
                                        #     autoscaling.BlockDevice(
                                        #         device_name="/dev/xvda",
                                        #         volume=autoscaling.BlockDeviceVolume.ebs(
                                        #             volume_type=autoscaling.EbsDeviceVolumeType.GP2,
                                        #             volume_size=12,
                                        #             delete_on_termination=True
                                        #         )),
                                        #     autoscaling.BlockDevice(
                                        #         device_name="/dev/sdb",
                                        #         volume=autoscaling.BlockDeviceVolume.ebs(
                                        #             volume_size=20)
                                        #         # 20GB, with default volume_type gp2
                                        #     )
                                        # ]
                                        )
        self.asc.connections.allow_from(alb, ec2.Port.tcp(
            80), "ALB access 80 port of EC2 in Autoscaling Group")

        self.asc.connections.allow_from(alb, ec2.Port.tcp(
            443), "ALB access 443 port of EC2 in Autoscaling Group")
        listener.add_targets("addTargetGroup",
                             port=443,
                             targets=[self.asc])
        self.asc.role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore"))
        zone = r53.HostedZone.from_hosted_zone_attributes(
            self, 'MYHOSTED_ZONE', hosted_zone_id=my_hosted_zone, zone_name=my_zone_name)

        r53alias = r53.ARecord(self, 'Alias-alb', zone=zone, record_name="cdkalb", ttl=core.Duration.minutes(
            5), target=r53.RecordTarget.from_alias(r53tg.LoadBalancerTarget(alb)))

        self.asc.scale_on_request_count(
            "AModestLoad", target_requests_per_second=3)

        core.CfnOutput(self, "Output",
                       value=alb.load_balancer_dns_name)

        core.CfnOutput(self, "Domain",
                       value=r53alias.domain_name)
