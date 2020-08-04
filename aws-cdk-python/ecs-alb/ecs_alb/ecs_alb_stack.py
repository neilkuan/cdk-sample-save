from aws_cdk import (
    core,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_ecr as ecr,
    aws_ec2 as ec2,
    aws_ecs as ecs, 
    aws_route53 as r53,
    aws_ecs_patterns as ecs_patterns, 
    aws_route53_targets as r53target,
    aws_certificatemanager as acm, 
    aws_elasticloadbalancingv2 as elb2)

#domain='ecs.cathaycloud.online'
#zone='cathaycloud.online'

# need to change your host_zone .

my_hosted_zone = "ZZZZZZZZZZZZZZZZZZZZZZZZZONE_ID"

# need to change your zone_name . 
my_zone_name = "ROUTE53_HOST_DOMAIN"

myAcm = 'arn:.....acm..'

class EcsAlbStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)
        
        # create ecr
        newecr = ecr.Repository(self,"ecr20200423" , repository_name="ecr20200423",removal_policy=core.RemovalPolicy.DESTROY)
        
        # create s3 bucketss
        BlockPOptions = s3.BlockPublicAccess(ignore_public_acls=True, restrict_public_buckets=True)
        news3 = s3.Bucket(self, "s3bucket", bucket_name='zxcvbsdfghwerty2020',removal_policy=core.RemovalPolicy.DESTROY,
        encryption=s3.BucketEncryption.KMS_MANAGED,block_public_access=BlockPOptions )
        
        # removal_policy=core.RemovalPolicy.DESTROY 此指令是為了下cdk destroy 可以刪除現有名稱的資源


        #Create dynamodb
        table = dynamodb.Table(self, "EMPLOYEE", table_name="EMPLOYEE"
            ,partition_key=dynamodb.Attribute(name="id",type=dynamodb.AttributeType.NUMBER),removal_policy=core.RemovalPolicy.DESTROY) # removal_policy=core.RemovalPolicy.DESTROY 此指令是為了下cdk destroy 可以刪除現有名稱的資源

        # Create a new vpc for ecscluster 3 az , 6 subnet == 3 public subnet and 3 private subnet , only one nat gateway .
        ecsvpc = ec2.Vpc(self , 'ecsvpc', cidr='10.0.0.0/24', enable_dns_hostnames=True, enable_dns_support=True, max_azs=3, nat_gateways=1 ) 
        
        # Create an  ecscluster .
        cluster = ecs.Cluster(self, 'ecCluster' , vpc=ecsvpc , cluster_name='ecs-demo')
        
        # find my host_zon in my account .
        zone = r53.HostedZone.from_hosted_zone_attributes(self, 'MYHOSTED_ZONE', hosted_zone_id=my_hosted_zone, zone_name=my_zone_name )

        # add autoscaling group for your ecs cluster. default in private subnet .
        #cluster.add_capacity("DefaultAutoScalingGroup", instance_type=ec2.InstanceType("t2.micro"),can_containers_access_instance_role=True )
        
        
        # find my exist acm for *.cathaycloud.online CA .
        myacm = acm.Certificate.from_certificate_arn(self , 'MYACM', myAcm )
        
        # ecs tasks role 
        ecstasksrole = iam.Role(self, 'ecstasksrole', role_name='ecstasksroledemo',
                                assumed_by=iam.ServicePrincipal('ecs-tasks.amazonaws.com'))
        # role add policy 
        ecstasksrole.add_to_policy(iam.PolicyStatement(effect=iam.Effect.ALLOW, resources=[
                                   "arn:aws:dynamodb:ap-northeast-1:accountid:table/"+ table.table_name  ,
                                   "arn:aws:dynamodb:ap-northeast-1:accountid:table/"+ table.table_name +"/index/*",
                                   news3.bucket_arn + "/*"], actions=["s3:PutObject", "dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:Query", "dynamodb:UpdateItem", "dynamodb:Scan"]))
        
        # find ecr 
        findecr = ecr.Repository.from_repository_name(self , "findecr" , repository_name='ecs-java')
        # image = docker image name , container_name for your container_name , container_port for your service expose port .
        
        ecs_fargate=ecs_patterns.ApplicationLoadBalancedFargateService(
            self , 'Fargate',
            cluster=cluster, listener_port=443,
            memory_limit_mib=512,certificate=myacm,domain_name="ecs-java."＋my_zone_name,domain_zone=zone,
            task_image_options={
                #'image': ecs.ContainerImage.from_registry("guanyebo/java-spring-boot:test"), 
                #'image': ecs.ContainerImage.from_registry("guanyebo/ecs-java:test"), 
                'image': ecs.ContainerImage.from_ecr_repository(repository=findecr, tag="latest"),
                'container_name' : 'Java', 
                'container_port' : 8080,
                'task_role' : ecstasksrole.without_policy_updates()
            }
        )


        ecs_fargate.target_group.configure_health_check(path="/employee/healthCheck", healthy_http_codes="200")
        #core.CfnOutput(self, 'DomainName' , value=newdomain.domain_name)
        core.CfnOutput(self,'table.name',value=table.table_name)
        core.CfnOutput(self,'s3.name',value=news3.bucket_name)
        core.CfnOutput(self,'ecr.name',value=newecr.repository_name)
        
