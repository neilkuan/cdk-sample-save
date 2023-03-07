# cdk-sample-save



- tips: create custom cidrblock subnet .
```typescript
import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';

export class FargetMultipleStackStack extends cdk.Stack {
  readonly vpc: ec2.IVpc;
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // create custom cidrblock subnet .
    const iGWId = 'igw-xxxxxx'
    const defaultVpc = ec2.Vpc.fromLookup(this , 'testDf',{
      isDefault: true
    });

    const defaultpubS = new ec2.PublicSubnet(this,'testPub',{
      vpcId: defaultVpc.vpcId,
      availabilityZone: `${this.region}a`,
      cidrBlock: '172.31.48.0/20',
      mapPublicIpOnLaunch: true,

    });
    const att = new ec2.CfnVPCGatewayAttachment(this, 'VPCGW', {
      internetGatewayId: `${iGWId}`,
      vpcId: defaultVpc.vpcId,
    });
    defaultpubS.addDefaultInternetRoute(
      `${iGWId}`, att
    )
    att.node.addDependency(defaultpubS)
  }
}

```

### Find Centos 7 ami
```typescript
ec2.MachineImage.lookup({
      name: '*CentOS-7*',
      owners: ['679593333241'],
    });.getImage(this).imageId;
```
### Find Centos 8 ami
```typescript
ec2.MachineImage.lookup({
      name: '*CentOS-8*',
      owners: ['679593333241'],
    });.getImage(this).imageId;
```


### Find Ubuntu ami
```typescript
ec2.MachineImage.lookup({
       //name: '*ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server*',
        name: '*ubuntu-bionic-18.04-amd64-*',
        owners: ['099720109477'],
        filters: {
          ['root-device-type']: ['ebs'],
        },
      }).getImage(this).imageId
```


### How to use `CfnKeyPair` and download.
```ts
const key = new CfnKeyPair(this, 'Mykey', {
      keyName: 'labcdk',
    });
    
new CfnOutput(this, 'key', {
      value: `aws ssm get-parameter --name /ec2/keypair/${key.getAtt('KeyPairId')} --region ${this.region} --with-decryption --query 'Parameter."Value"' --output text > ${key.keyName}.pem`,
    });
```

### In Case lookup `dummy-value` back.
issue link:
[21520](https://github.com/aws/aws-cdk/pull/21520)
[8699](https://github.com/aws/aws-cdk/issues/8699#issuecomment-976159825)
[aws-docs](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ssm-readme.html#lookup-existing-parameters)
```ts
let roleArnValue
let roleArn = ssm.StringParameter.valueFromLookup(this, "/param/testRoleArn");
if (roleArn.includes('dummy-value')) {
  roleArnValue = 'arn:aws:service:eu-central-1:123456789012:entity/dummy-value';
} else {
  roleArnValue = roleArn
}
const role = iam.Role.fromRoleArn(this, "role", roleArnValue);


//or

const roleArn = ssm.StringParameter.valueFromLookup(this, "/param/testRoleArn");
// use Lazy function let cdk app lookup back later.
const role = iam.Role.fromRoleArn(this, "role", cdk.Lazy.string({ produce: () => roleArn }));

```


### Select vpcSubnet when new `aws_eks.Cluster` error
- Case:
```ts
export class MyStack extends Stack {
  vpc: aws_ec2.IVpc;
  constructor(scope: Construct, id: string, props: MyStackProps) {
    super(scope, id, props);

    this.vpc = aws_ec2.Vpc.fromLookup(this, 'lookup', {
      vpcId: props.vpcId,
    });

    new aws_eks.Cluster(this, 'Cluster', {
      vpc: this.vpc,
      version: aws_eks.KubernetesVersion.V1_21,
      vpcSubnets: [{ subnetGroupName: 'PrivateA' }, { subnetGroupName: 'Public' }],
      endpointAccess: aws_eks.EndpointAccess.PUBLIC_AND_PRIVATE.onlyFrom('1.2.3.4/32'),
    });
  }
}
```
error message:
```ts
Vpc must contain private subnets when public endpoint access is restricted
```
- vpc.lookup() looks for vpc and stores it in cdk.context.json, before select subnet, new eks.Cluster() is assigned dummy vpc in advance...


- Solution: [iussue](https://github.com/aws/aws-cdk/issues/19425)
```ts
export class MyStack extends Stack {
  vpc: aws_ec2.IVpc;
  constructor(scope: Construct, id: string, props: MyStackProps) {
    super(scope, id, props);

    this.vpc = aws_ec2.Vpc.fromLookup(this, 'lookup', {
      vpcId: props.vpcId,
    });

    if (this.vpc.vpcId === 'vpc-12345') {
    // if get Dummy Vpc, find again...
      this.vpc = aws_ec2.Vpc.fromLookup(this, 'lookup2', {
        vpcId: props.vpcId,
      });
    }
    // if get Dummy Vpc, will not new Cluster class...
    if (this.vpc.vpcId !== 'vpc-12345') {
      new aws_eks.Cluster(this, 'Cluster', {
        vpc: this.vpc,
        version: aws_eks.KubernetesVersion.V1_21,
        vpcSubnets: [{ subnetGroupName: 'PrivateA' }, { subnetGroupName: 'Public' }],
        endpointAccess: aws_eks.EndpointAccess.PUBLIC_AND_PRIVATE.onlyFrom('1.2.3.4/32'),
      });
    }
  }
}
```

#### Find new VPC NatGateway eip address 
```ts
const vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: 'HttpApiVpc',
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: 'PrivateNatSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      maxAzs: 3,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });
vpc.publicSubnets.forEach((publicSubnet, index) => {
    const eip = publicSubnet.node.children.find(c => (c as CfnResource).cfnResourceType === 'AWS::EC2::EIP') as ec2.CfnEIP;
    if (eip) {
      new CfnOutput(this, `eip${index}`, {
          value: `${eip.ref}`,
     });
    }
});
```



### ECS RUN Task IN Tail do not thing.
```ts
 const fargateTaskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef');
    
fargateTaskDefinition.addContainer(
      'Container',
      {
        containerName: 'nginx',
        image: ecs.ContainerImage.fromRegistry('nginx'),
        entryPoint: [''],
        command: ['tail', '-f', '/dev/null'],
      },
    );
```

### ECS Service dependency Capacity Provider Aspect
```ts
import {
  aws_ecs,
  IAspect,
  Aspects,
} from 'aws-cdk-lib';
import { IConstruct } from 'constructs';

/**
 * Add a dependency from capacity provider association to the cluster
 * and from each service to the capacity provider association.
 */
class CapacityProviderDependencyAspect implements IAspect {
  public visit(node: IConstruct): void {
    if (node instanceof aws_ecs.FargateService) {
      const children = node.cluster.node.findAll();
      for (const child of children) {
        if (child instanceof aws_ecs.CfnClusterCapacityProviderAssociations) {
          child.node.addDependency(node.cluster);
          node.node.addDependency(child);
        }
      }
    }
  }
}


Aspects.of(this).add(new CapacityProviderDependencyAspect());
```

### Slack Approval Bot Action on Codepipeline
```ts
import { ActionCategory, CommonActionProps, IStage, ActionBindOptions, ActionConfig } from '@aws-cdk/aws-codepipeline';
import { Action } from '@aws-cdk/aws-codepipeline-actions';
import { ITopic } from '@aws-cdk/aws-sns';
import { Construct } from '@aws-cdk/core';

export interface SlackApprovalActionProps extends CommonActionProps {
  readonly additionalInformation?: string;
  readonly externalEntityLink?: string;
  /**
   * for codepipeline send approval event
   */
  readonly topic: ITopic;
}

/**
 * idea from
 * see: https://github.com/cloudcomponents/cdk-constructs/blob/master/packages/cdk-codepipeline-slack
 */
export class SlackApprovalAction extends Action {
  public constructor(private props: SlackApprovalActionProps) {
    super({
      ...props,
      category: ActionCategory.APPROVAL,
      provider: 'Manual',
      artifactBounds: {
        minInputs: 0,
        maxInputs: 0,
        minOutputs: 0,
        maxOutputs: 0,
      },
    });

    this.props = props;
  }

  protected bound(scope: Construct, stage: IStage, options: ActionBindOptions): ActionConfig {
    const topic = this.props.topic;
    topic.grantPublish(options.role);

    return {
      configuration: {
        NotificationArn: topic.topicArn,
        CustomData: this.props.additionalInformation,
        ExternalEntityLink: this.props.externalEntityLink,
      },
    };
  }
}


```
