import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class Vpcstack extends cdk.Stack {
  readonly vpc: ec2.Vpc;
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);
    this.vpc = new ec2.Vpc(this, 'Vpc', { maxAzs: 3, natGateways: 1 });
  }
};


export interface VpcClienVpnStackProps extends cdk.StackProps {
  readonly client_root_arn: string;
  readonly server_root_arn: string;
  readonly client_cidr: string;
  readonly vpc: ec2.Vpc;
  readonly internetvianat?: boolean;
}

export class VpcClienVpnStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VpcClienVpnStackProps) {
    super(scope, id, props);

    const vpc = props.vpc;

    const logGroup = new logs.LogGroup(this, 'ClientVpnLogGroup', {
      retention: logs.RetentionDays.ONE_MONTH,
    });

    const logStream = logGroup.addStream('ClientVpnLogStream');

    const vpnEndpoint = new ec2.CfnClientVpnEndpoint(this, 'VpnEndpoint', {
      authenticationOptions: [{
        type: 'certificate-authentication',
        mutualAuthentication: {
          clientRootCertificateChainArn: props.client_root_arn,
        },
      }],
      clientCidrBlock: props.client_cidr,
      connectionLogOptions: {
        enabled: true,
        cloudwatchLogGroup: logGroup.logGroupName,
        cloudwatchLogStream: logStream.logStreamName,
      },
      serverCertificateArn: props.server_root_arn,
      splitTunnel: false,
      dnsServers: ['8.8.8.8', '8.8.4.4'],
    });

    new ec2.CfnClientVpnTargetNetworkAssociation(this, 'ClientVpnNetworkAssociation1', {
      clientVpnEndpointId: vpnEndpoint.ref,
      subnetId: vpc.privateSubnets[0].subnetId,
    });
    new ec2.CfnClientVpnTargetNetworkAssociation(this, 'ClientVpnNetworkAssociation2', {
      clientVpnEndpointId: vpnEndpoint.ref,
      subnetId: vpc.privateSubnets[1].subnetId,
    });

    new ec2.CfnClientVpnAuthorizationRule(this, 'Authz', {
      clientVpnEndpointId: vpnEndpoint.ref,
      targetNetworkCidr: vpc.vpcCidrBlock,
      authorizeAllGroups: true,
    });
    new cdk.CfnOutput(this, 'VpnClientId', {
      value: vpnEndpoint.ref,
    });
    // if you want Authorization go to internet via natgateway.
    if (props.internetvianat) {
      new ec2.CfnClientVpnAuthorizationRule(this, 'AuthzInternet', {
        clientVpnEndpointId: vpnEndpoint.ref,
        targetNetworkCidr: '0.0.0.0/0',
        authorizeAllGroups: true,
      });

      new ec2.CfnClientVpnRoute(this, 'ToInternetRoute', {
        clientVpnEndpointId: vpnEndpoint.ref,
        destinationCidrBlock: '0.0.0.0/0',
        targetVpcSubnetId: vpc.privateSubnets[1].subnetId,
      });
    }

  }
}

// for development, use account/region from cdk cli
const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();
const vpcst = new Vpcstack(app, 'vpn-vpc', { env: devEnv });
const vpn = new VpcClienVpnStack(app, 'vpn', {
  env: devEnv,
  vpc: vpcst.vpc,
  client_cidr: '192.168.100.0/22',
  client_root_arn: app.node.tryGetContext('CLIENT_ARN'),
  server_root_arn: app.node.tryGetContext('SERVER_ARN'),
  // if internetvianat true you can via natgateway to internet.
  internetvianat: true,
});

vpn.addDependency(vpcst);
app.synth();