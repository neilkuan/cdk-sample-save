##from aws_cdk import core
#import modlue you needed
import os.path as path 
import sys

from aws_cdk import (
    core,
    aws_ec2 as ec2,
    aws_ecr as ecr,
    aws_eks as eks,
    aws_iam as iam,
    aws_codebuild as codebuild,
    aws_codecommit as codecommit,
    aws_events_targets as targets
    
)

class CdkStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # The code that defines your stack goes here
        
        # Create a new VPC with single NAT Gateway
        
        # Use Deafult VPC .
        # vpc = ec2.Vpc.from_lookup(self,"VPC", is_default=True)
        
        
        # Or Create a New VPC .
        # vpc = ec2.Vpc(self, "TheVPC",
        # cidr="10.0.0.0/16")

        # Iterate the private subnets

        #selection = vpc.select_subnets(
        #   subnet_type=ec2.SubnetType.PRIVATE)

        #for subnet in selection.subnets:
        #   pass

        # create iam role for eks cluster .
        clusterAdmin = iam.Role(self, "AdminRole" , assumed_by=iam.AccountRootPrincipal())
        
        # create a new eks cluster .
        cluster = eks.Cluster(self, "EKSLABCluster", default_capacity=2 ,masters_role=clusterAdmin , 
                                output_cluster_name=True)
        
        # create new ecr repository .
        eksecr = ecr.Repository(self, "eksecr" , repository_name="eksecr")
        
        
        
        # Example automatically generated without compilation. See https://github.com/aws/jsii/issues/826
        # import aws_cdk.aws_codebuild as codebuild
        # import aws_cdk.aws_codecommit as codecommit
        #
        # repository = codecommit.Repository(self, "MyRepo", repository_name="foo")
        # codebuild.Project(self, "MyFirstCodeCommitProject",
        # source=codebuild.Source.code_commit(repository=repository)
        # )

        # create codecommit repository .
        repository = codecommit.Repository(self, "CodeCommitRepo", repository_name="EKSLABClusterRepo")

        # create codebuild porject .
        project = codebuild.Project(self, "Project", project_name="MyProject",source=codebuild.Source.code_commit(repository=repository),
                    environment=codebuild.BuildEnvironment(build_image=codebuild.LinuxBuildImage.from_asset(self, "CustomImage",directory=path.join("../dockerAssets.d")),privileged=True)
                    ,environment_variables={
                        "CLUSTER_NAME":{
                        "value":cluster.cluster_name},
                         "ECR_REPO_URI":{
                         "value": eksecr.repository_uri}
                    },
                    build_spec=codebuild.BuildSpec.from_object(
                        {
                            "version":"0.2",
                            "phases":{
                                "pre_build":{
                                    "commands":[
                                        "env",
                                        "export TAG=${CODEBUILD_RESOLVED_SOURCE_VERSION}",
                                        "/usr/local/bin/entrypoint.sh"
                                        ]
                                    },
                                "build":{
                                    "commands":[
                                        "cd flask-docker-app",
                                        "docker build -t $ECR_REPO_URI:$TAG .",
                                        "$(aws ecr get-login --no-include-email)",
                                        "docker push $ECR_REPO_URI:$TAG"
                                        ]
                                     },
                                "post_build":{
                                    "commands":[
                                        "kubectl get no",
                                        "kubectl set image deployment flask flask=$ECR_REPO_URI:$TAG"
                                        ]
                                    }
                                }
                            }))
        repository.on_commit("Oncommit", target=targets.CodeBuildProject(codebuild.Project.from_project_arn(self, "OnommitEvents" , project.project_arn)))
        
        eksecr.grant_pull_push(project.role)
        cluster.aws_auth.add_masters_role(project.role)
        project.add_to_role_policy(iam.PolicyStatement(
                actions=["eks:DescribeCluster"],
                resources=[cluster.cluster_arn],
            ))
        core.CfnOutput(self,"CodeCommitRepoName",value=repository.repository_name)
        core.CfnOutput(self,"CodeCommitRepoArn",value=repository.repository_arn)
        core.CfnOutput(self,"CodeCommitCloneUrlSsh",value=repository.repository_clone_url_ssh)
        core.CfnOutput(self,"CodeCommitCloneUrlHttp",value=repository.repository_clone_url_http)
            
        