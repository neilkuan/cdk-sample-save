from aws_cdk import (
    Stack,
    aws_ecs as ecs,
    aws_ec2 as ec2,
)
from constructs import Construct

class ArmFargateStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        vpc = ec2.Vpc.from_lookup(self, "VPC", is_default=True)
        cluster = ecs.Cluster(self, "Cluster", vpc=vpc, cluster_name="python_cluster")
        task = ecs.FargateTaskDefinition(self, "Task")
        task.add_container("web", image=ecs.ContainerImage.from_registry("public.ecr.aws/nginx/nginx:1.20-arm64v8"))
        ecs.FargateService(self, "Service", cluster=cluster, task_definition=task, assign_public_ip=True)
        as_CfnTaskDefinition(task.node.default_child)

def as_CfnTaskDefinition(objetc: ecs.CfnTaskDefinition ):
    return objetc.add_property_override("RuntimePlatform",{
      "CpuArchitecture": 'ARM64',
      "OperatingSystemFamily": 'LINUX',
    })