import * as path from 'path';
import * as cdk from '@aws-cdk/core';
import * as rds from '@aws-cdk/aws-rds';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as _lambda from '@aws-cdk/aws-lambda';
import * as iam from '@aws-cdk/aws-iam';
export class CdkStack extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    // random password gen ~~
    //var randomstring: string = Math.random().toString(36).slice(-8)
     //already create subnet group in rds subnet group .
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

    //const dbsec = new rds.DatabaseSecret(this, 'Secret', {
    //  username: 'admin',
    //})

    const lambadFn = new _lambda.Function(this, 'lambda-exe-rds', {
      runtime: _lambda.Runtime.PYTHON_3_8,
      handler: 'index.lambda_handler',
      code: _lambda.Code.fromAsset(path.join(__dirname, '../lambda-hander')),
      environment: {
        passwdarn: `${dbcluster.secret?.secretValue}`
        //passwdarn: `${dbcluster.secret?.secretArn}`
      }
    });

    const smpolicy = new iam.PolicyStatement({
      resources: ['*'],
      actions: ['secretsmanager:*'],
      }
    );
    lambadFn.addToRolePolicy(smpolicy);
    // CfnOutput will be {{resolve:secretsmanager:arn:aws:secretsmanager:ap-northeast-1:295273672130:secret:CdkStackRDSClusterSecret091-ueJupJNmIs3S-DnHqnF:SecretString:::}}
    new cdk.CfnOutput(this, 'sss', {
      value: `${dbcluster.secret?.secretValue}`,
    });
  }
}