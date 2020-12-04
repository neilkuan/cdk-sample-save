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

### Find Centos ami
```typescript
ec2.MachineImage.lookup({
        filters: {
          ['product-code']: ['aw0evgkw8e5c1q413zgy5pjce'],
        },
        name: '*CentOS*',
        owners: ['aws-marketplace'],
      }).getImage(this).imageId
```
### Find Ubuntu ami
```typescript
ec2.MachineImage.lookup({
        name: '*ubuntu-bionic-18.04-amd64-*',
        owners: ['099720109477'],
      }).getImage(this).imageId
```
