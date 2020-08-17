import * as cdk from '@aws-cdk/core';
import * as rds from '@aws-cdk/aws-rds';
import * as ec2 from '@aws-cdk/aws-ec2';
export class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // random password gen ~~
    var randomstring: string = Math.random().toString(36).slice(-8);

    // already create subnet group in rds subnet group .
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVpc', {
      isDefault: true,
    });

    const dbclusterpg = new rds.ParameterGroup(this, 'dbpg', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_2_07_1,
      }),
      parameters: {
        //time_zone: 'Asia/Taipei',
        time_zone: 'UTC',
      },
    });

    const dbcluster = new rds.DatabaseCluster(this, 'RDSCluster', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_2_07_1,
      }),
      parameterGroup: dbclusterpg,
      masterUser: {
        password: new cdk.SecretValue(randomstring),
        username: 'admin',
      },
      instances: 1,
      instanceProps: {
        // if want publicAccess , need to define vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC } ,
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
        instanceType: new ec2.InstanceType('t3.small'),
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      defaultDatabaseName: 'timezonetest',
    });

    // add SG ingress my ip .
    dbcluster.connections.allowDefaultPortFrom(
      ec2.Peer.ipv4(this.node.tryGetContext('IP'))
    );
    new cdk.CfnOutput(this, 'passwd', {
      value: randomstring,
    });

    new cdk.CfnOutput(this, 'DBurl', {
      value: dbcluster.clusterEndpoint.hostname,
    });
  }
}
