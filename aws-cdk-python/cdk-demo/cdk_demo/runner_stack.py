from aws_cdk import (
    core,
    aws_ec2 as ec2,
    aws_iam as iam
)
my_key_pair = "eksworker"


class RunnerStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, vpc: ec2.IVpc, runnerrole: iam.IRole, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)
        # The code that defines your stack goes here
        token = self.node.try_get_context("gitlab-token")
        shellCommands = ec2.UserData.for_linux()
        shellCommands.add_commands("yum update -y")
        shellCommands.add_commands("yum install docker -y")
        shellCommands.add_commands("systemctl start docker")
        shellCommands.add_commands("systemctl enable docker")
        shellCommands.add_commands("usermod -aG docker ec2-user")
        shellCommands.add_commands("usermod -aG docker ssm-user")
        shellCommands.add_commands("chmod +x /var/run/docker.sock")
        shellCommands.add_commands("systemctl restart docker")
        shellCommands.add_commands(
            "docker run -d -v /home/ec2-user/.gitlab-runner:/etc/gitlab-runner -v /var/run/docker.sock:/var/run/docker.sock --name gitlab-runner-register gitlab/gitlab-runner:alpine register --non-interactive --url https://gitlab.com./ --registration-token " + token + " --docker-volumes \"/var/run/docker.sock:/var/run/docker.sock\" --executor docker --docker-image \"alpine:latest\" --description \"Docker Runner\" --tag-list \"demo,runner,cdk\" --docker-privileged")
        shellCommands.add_commands(
            "sleep 2 && docker run --restart always -d -v /home/ec2-user/.gitlab-runner:/etc/gitlab-runner -v /var/run/docker.sock:/var/run/docker.sock --name gitlab-runner gitlab/gitlab-runner:alpine")

        runnerSG = ec2.SecurityGroup(self, 'Gitlab-Runner-SG', vpc=vpc, security_group_name="Gitlab-Runner-SG",
                                     description="for aws cdk python lab Gitlab-Runner SG")
        shellCommands.add_commands("yum install mysql -y ")
        runner = ec2.Instance(self, 'Gitlab-Runner', instance_type=ec2.InstanceType(instance_type_identifier="t3.small"), instance_name='Gitlab-Runner', role=runnerrole,
                              vpc=vpc, security_group=runnerSG, key_name=my_key_pair, vpc_subnets=ec2.SubnetSelection(
            subnet_type=ec2.SubnetType.PRIVATE),
            machine_image=ec2.LookupMachineImage(name="amzn2-ami-hvm-2.0.20200406.0-x86_64-gp2", user_data=shellCommands), block_devices=[ec2.BlockDevice(device_name='/dev/xvda', volume=ec2.BlockDeviceVolume.ebs(60))])

        core.CfnOutput(self, 'instance-id', value=runner.instance_id)
        core.CfnOutput(self, 'runner-role', value=runnerrole.role_arn)
