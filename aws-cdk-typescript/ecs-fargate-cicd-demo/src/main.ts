import * as path from 'path';
import * as codebuild from '@aws-cdk/aws-codebuild';
import * as codecommit from '@aws-cdk/aws-codecommit';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecr from '@aws-cdk/aws-ecr';
import { DockerImageAsset } from '@aws-cdk/aws-ecr-assets';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as cdk from '@aws-cdk/core';
import * as ecrDeploy from 'cdk-ecr-deployment';
export class DemoStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps = {}) {
    super(scope, id, props);
    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', { isDefault: true });

    // Create a new ECR Repository
    const repo = new ecr.Repository(this, 'NginxRepo', {
      repositoryName: 'nginx',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const image = new DockerImageAsset(this, 'CDKDockerImage', {
      directory: path.join(__dirname, '../docker'),
    });

    const ecrdeploy = new ecrDeploy.ECRDeployment(this, 'DeployDockerImage', {
      src: new ecrDeploy.DockerImageName(image.imageUri),
      dest: new ecrDeploy.DockerImageName(`${repo.repositoryUri}:latest`),
    });

    const cluster = new ecs.Cluster(this, 'ecs-cluster', {
      vpc: vpc,
      clusterName: 'demoECSCICD',
    });

    // ***ECS Contructs***

    const executionRolePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
        'ecr:GetAuthorizationToken',
        'ecr:BatchCheckLayerAvailability',
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchGetImage',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
    });
    const devtaskDef = new ecs.FargateTaskDefinition(this, 'dev-taskdef');
    const prodtaskDef = new ecs.FargateTaskDefinition(this, 'prod-taskdef');
    [devtaskDef, prodtaskDef].forEach(( t )=> {
      t.addToExecutionRolePolicy(executionRolePolicy);
      t.addContainer('nginx', {
        image: ecs.ContainerImage.fromEcrRepository(repo),
        memoryReservationMiB: 256,
        cpu: 256,
        portMappings: [{ containerPort: 80 }],
        environment: {
          APPLE: 'yes',
        },
      });
    });

    const devfargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'dev-service', {
      serviceName: 'devfargateService',
      cluster: cluster,
      taskDefinition: devtaskDef,
      publicLoadBalancer: true,
      desiredCount: 1,
      assignPublicIp: true,
      listenerPort: 80,
      taskSubnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC }),
    });

    const prodfargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'prod-service', {
      serviceName: 'prodfargateService',
      cluster: cluster,
      taskDefinition: prodtaskDef,
      publicLoadBalancer: true,
      desiredCount: 1,
      assignPublicIp: true,
      listenerPort: 80,
      taskSubnets: vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC }),
    });

    devfargateService.node.addDependency(ecrdeploy);
    prodfargateService.node.addDependency(ecrdeploy);

    // ***PIPELINE CONSTRUCTS***


    // ECR - repo
    const codecommitRepo = new codecommit.Repository(this, 'codecommit-repo', {
      repositoryName: 'ecsCicdDemo',
    });
    const artifactBucket = new s3.Bucket(this, 'MyECSPipelineArtifactBucket', {
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    this.createPipeline(codecommitRepo, 'dev', devfargateService.service, artifactBucket, 'nginx', 'nginx');
    this.createPipeline(codecommitRepo, 'prod', prodfargateService.service, artifactBucket, 'nginx', 'nginx');

    new cdk.CfnOutput(this, 'DevLoadBalancerDNS', { value: devfargateService.loadBalancer.loadBalancerDnsName });
    new cdk.CfnOutput(this, 'ProdLoadBalancerDNS', { value: prodfargateService.loadBalancer.loadBalancerDnsName });
  }
  private createPipeline (
    codecommitRepo: codecommit.IRepository, env: string, svc: ecs.IBaseService, artifactBucket: s3.IBucket,
    containerName: string, ecrRepoName: string) {
    // CODEBUILD - project
    const codecommitSource = codebuild.Source.codeCommit({
      repository: codecommitRepo,
    });

    const project = new codebuild.Project(this, `MyProject-${env}`, {
      projectName: `${this.stackName}-${env}`,
      source: codecommitSource,
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_3,
        privileged: true,
      },
      environmentVariables: {
        ECR_REPO_NAME: { value: ecrRepoName },
        CONTAINER_NAME: { value: containerName },
        AWS_DEFAULT_REGION: { value: this.region },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          build: {
            commands: [
              'echo "In Post-Build Stage"',
              'export TAG=`cat version.txt`',
              'export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output=text)',
              'export ECR_REPO_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$ECR_REPO_NAME"',
              'echo "New Version is $ECR_REPO_URI:$TAG ..."',
              'export CHECK=$(aws ecr list-images --repository-name $ECR_REPO_NAME --query [\'imageIds\'] --filter tagStatus="TAGGED" --output text | grep $TAG | wc -l)',
              'if [ $CHECK == 1 ];then echo "okay! This version is existed"; else echo "This image version not found" && exit 1; fi',
              'printf \'[{\"name\":\"%s\",\"imageUri\":\"%s\"}]\' $CONTAINER_NAME $ECR_REPO_URI:$TAG > imagedefinitions.json',
              'pwd; ls -al; cat imagedefinitions.json',
            ],
          },
        },
        artifacts: {
          files: [
            'imagedefinitions.json',
          ],
        },
      }),
    });

    // ***PIPELINE ACTIONS***

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();
    var branch = '';
    if (env === 'dev') {
      branch = 'dev';
    } else if (env === 'prod') {
      branch = 'master';
    }
    const sourceAction = new codepipeline_actions.CodeCommitSourceAction({
      actionName: `CodeCommit_Source_${branch}`,
      branch,
      repository: codecommitRepo,
      output: sourceOutput,
    });

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'CodeBuild',
      project,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    const manualApprovalAction = new codepipeline_actions.ManualApprovalAction({
      actionName: 'Approve',
    });
    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'DeployAction',
      service: svc,
      imageFile: new codepipeline.ArtifactPath(buildOutput, 'imagedefinitions.json'),
    });


    // PIPELINE STAGES

    new codepipeline.Pipeline(this, `MyECSPipeline${env}`, {
      pipelineName: `${this.stackName}-${env}-pipeline`,
      artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction],
        },
        {
          stageName: 'Build',
          actions: [buildAction],
        },
        {
          stageName: 'Approve',
          actions: [manualApprovalAction],
        },
        {
          stageName: 'Deploy-to-ECS',
          actions: [deployAction],
        },
      ],
    });
    project.role!.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryFullAccess'));
    return project;
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();

new DemoStack(app, 'ecs-fargate-cicd-demo-dev', { env: devEnv });

app.synth();