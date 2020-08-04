from aws_cdk import (
    core,
    aws_ec2 as ec2,
    aws_eks as eks,
    aws_iam as iam,
    aws_kinesis as kinesis
)
import kns_stack
from load_config_files import read_k8s_resource, read_docker_daemon_resource
iampolicy = iam.PolicyStatement(effect=iam.Effect.ALLOW,
                                actions=[
                                    "acm:DescribeCertificate",
                                    "acm:ListCertificates",
                                    "acm:GetCertificate",
                                    "autoscaling:DescribeAutoScalingInstances",
                                    "autoscaling:SetDesiredCapacity",
                                    "autoscaling:DescribeAutoScalingGroups",
                                    "autoscaling:TerminateInstanceInAutoScalingGroup",
                                    "cognito-idp:DescribeUserPoolClient",
                                    "ec2:AuthorizeSecurityGroupIngress",
                                    "ec2:CreateSecurityGroup",
                                    "ec2:CreateTags",
                                    "ec2:DeleteTags",
                                    "ec2:DeleteSecurityGroup",
                                    "ec2:DescribeAccountAttributes",
                                    "ec2:DescribeAddresses",
                                    "ec2:DescribeInstances",
                                    "ec2:DescribeInstanceStatus",
                                    "ec2:DescribeInternetGateways",
                                    "ec2:DescribeNetworkInterfaces",
                                    "ec2:DescribeSecurityGroups",
                                    "ec2:DescribeSubnets",
                                    "ec2:DescribeTags",
                                    "ec2:DescribeVpcs",
                                    "ec2:ModifyInstanceAttribute",
                                    "ec2:ModifyNetworkInterfaceAttribute",
                                    "ec2:RevokeSecurityGroupIngress",
                                    "elasticloadbalancing:AddListenerCertificates",
                                    "elasticloadbalancing:AddTags",
                                    "elasticloadbalancing:CreateListener",
                                    "elasticloadbalancing:CreateLoadBalancer",
                                    "elasticloadbalancing:CreateRule",
                                    "elasticloadbalancing:CreateTargetGroup",
                                    "elasticloadbalancing:DeleteListener",
                                    "elasticloadbalancing:DeleteLoadBalancer",
                                    "elasticloadbalancing:DeleteRule",
                                    "elasticloadbalancing:DeleteTargetGroup",
                                    "elasticloadbalancing:DeregisterTargets",
                                    "elasticloadbalancing:DescribeListenerCertificates",
                                    "elasticloadbalancing:DescribeListeners",
                                    "elasticloadbalancing:DescribeLoadBalancers",
                                    "elasticloadbalancing:DescribeLoadBalancerAttributes",
                                    "elasticloadbalancing:DescribeRules",
                                    "elasticloadbalancing:DescribeSSLPolicies",
                                    "elasticloadbalancing:DescribeTags",
                                    "elasticloadbalancing:DescribeTargetGroups",
                                    "elasticloadbalancing:DescribeTargetGroupAttributes",
                                    "elasticloadbalancing:DescribeTargetHealth",
                                    "elasticloadbalancing:ModifyListener",
                                    "elasticloadbalancing:ModifyLoadBalancerAttributes",
                                    "elasticloadbalancing:ModifyRule",
                                    "elasticloadbalancing:ModifyTargetGroup",
                                    "elasticloadbalancing:ModifyTargetGroupAttributes",
                                    "elasticloadbalancing:RegisterTargets",
                                    "elasticloadbalancing:RemoveListenerCertificates",
                                    "elasticloadbalancing:RemoveTags",
                                    "elasticloadbalancing:SetIpAddressType",
                                    "elasticloadbalancing:SetSecurityGroups",
                                    "elasticloadbalancing:SetSubnets",
                                    "elasticloadbalancing:SetWebACL",
                                    "iam:CreateServiceLinkedRole",
                                    "iam:GetServerCertificate",
                                    "iam:ListServerCertificates",
                                    "waf-regional:GetWebACLForResource",
                                    "waf-regional:GetWebACL",
                                    "waf-regional:AssociateWebACL",
                                    "waf-regional:DisassociateWebACL",
                                    "tag:GetResources",
                                    "tag:TagResources",
                                    "waf:GetWebACL",
                                    "shield:DescribeProtection",
                                    "shield:GetSubscriptionState",
                                    "shield:DeleteProtection",
                                    "shield:CreateProtection",
                                    "shield:DescribeSubscription",
                                    "shield:ListProtections",
                                    "wafv2:GetWebACL",
                                    "wafv2:GetWebACLForResource",
                                    "wafv2:AssociateWebACL",
                                    "wafv2:DisassociateWebACL"
                                ],
                                resources=["*"]
                                )

dnspolicy = iam.PolicyStatement(effect=iam.Effect.ALLOW,
                                actions=[
                                    "route53:ChangeResourceRecordSets",
                                    "route53:ListHostedZones",
                                    "route53:ListResourceRecordSets"
                                ],
                                resources=["*"]
                                )


class CdkDemoStack(core.Stack):

    def __init__(self, scope: core.Construct, id: str, vpc: ec2.IVpc, runnerrole: iam.IRole, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # The code that defines your stack goes here
        clusterAdmin = iam.Role(
            self, "AdminRole", assumed_by=iam.AccountRootPrincipal())

        cluster = eks.Cluster(
            self, 'ekscdkdemo',
            vpc=vpc,
            default_capacity=0
        )

        asg_worker_nodes = cluster.add_capacity(
            'eksspot-cdkdemo',
            spot_price="0.0544",
            instance_type=ec2.InstanceType('t3.medium'),
            desired_capacity=2,
            bootstrap_options=eks.BootstrapOptions(
                docker_config_json=read_docker_daemon_resource(
                    'eksbaseresource/docker-daemon.json')
            )
        )

        alb_rbac = eks.KubernetesResource(
            self, 'alb-rbac',
            cluster=cluster,
            manifest=read_k8s_resource(
                'eksbaseresource/alb-rbac.yml')
        )

        asg_worker_nodes.add_to_role_policy(iampolicy)
        cluster.aws_auth.add_masters_role(clusterAdmin)
        cluster.aws_auth.add_masters_role(runnerrole)

        service_account = cluster.add_service_account(
            "external-dns-sa", name='external-dns-sa')

        wellnessuser_irsa = cluster.add_service_account(
            "wellnessuser", name='wellnessuser')

        service_account.add_to_principal_policy(dnspolicy)

        deployment = {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {
                "labels": {
                    "app.kubernetes.io/name": "alb-ingress-controller"
                },
                "name": "alb-ingress-controller",
                "namespace": "kube-system"
            },
            "spec": {
                "selector": {
                    "matchLabels": {
                        "app.kubernetes.io/name": "alb-ingress-controller"
                    }
                },
                "template": {
                    "metadata": {
                        "labels": {
                            "app.kubernetes.io/name": "alb-ingress-controller"
                        }
                    },
                    "spec": {
                        "containers": [
                            {
                                "name": "alb-ingress-controller",
                                "args": [
                                    "--ingress-class=alb",
                                    "--cluster-name="+cluster.cluster_name
                                ],
                                "image": "docker.io/amazon/aws-alb-ingress-controller:v1.1.8"
                            }
                        ],
                        "serviceAccountName": "alb-ingress-controller"
                    }
                }
            }
        }
        alb_service = cluster.add_resource(
            'alb-ingress-controller', deployment)
        external_dns = eks.KubernetesResource(
            self, 'external-dns',
            cluster=cluster,
            manifest=read_k8s_resource(
                'eksbaseresource/external-dns.yml')
        )
        alb_service.node.add_dependency(alb_rbac)
        external_dns.node.add_dependency(service_account)
        core.CfnOutput(self, 'ClusterAdmin_Role_ARN',
                       value=clusterAdmin.role_arn)
        core.CfnOutput(self, 'Getupdateeks', value="aws eks update-kubeconfig --name " +
                       cluster.cluster_name + " --region ap-northeast-1 --role-arn " + clusterAdmin.role_arn)

        wellness_kns_stream = kinesis.Stream(
            self, 'WellnessKnsStream', retention_period=core.Duration.hours(24), shard_count=1, stream_name='event.member.appointment.devInfo')

        wellness_kns_stream.grant_read_write(wellnessuser_irsa)

        core.CfnOutput(self, 'kinesis_stream_arn',
                       value=wellness_kns_stream.stream_arn)

        core.CfnOutput(self, 'kinesis_stream_name',
                       value=wellness_kns_stream.stream_name)
