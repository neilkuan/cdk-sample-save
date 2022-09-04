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
