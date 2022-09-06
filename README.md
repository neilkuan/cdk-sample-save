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
- lookup vpc back save in cdk.context.json and select vpc subnet will return dummy vpc frist...


- Soultion: [iussue](https://github.com/aws/aws-cdk/issues/19425)
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
