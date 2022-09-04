import * as path from 'path';
import * as apiv2 from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apiv2ing from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { App, Stack, StackProps, CfnOutput, Duration } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as r53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);
    if (!this.node.tryGetContext('rootdomain') || !this.node.tryGetContext('hostedZoneId')) {
      new Error('Please give me context like "-c rootdomain=example.com -c hostedZoneId=ZXXXXXXXXXXXXX"');
    }
    const rootdomain = this.node.tryGetContext('rootdomain');
    const hostedZoneId = this.node.tryGetContext('hostedZoneId');

    const domainName = `apigateway.${rootdomain}`;
    const zone = r53.HostedZone.fromHostedZoneAttributes(this, 'hzone', { hostedZoneId: hostedZoneId, zoneName: rootdomain });
    const certificate = new acm.Certificate(this, 'CertificateValidation', {
      domainName,
      validation: acm.CertificateValidation.fromDns(zone),
    });
    const cdomainName = new apiv2.DomainName(this, 'CDomainName', {
      domainName,
      certificate,
    });
    const func = new lambda.Function(this, 'func', {
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda')),
      handler: 'index.handler',
      runtime: lambda.Runtime.PYTHON_3_8,
    });
    const httpApi = new apiv2.HttpApi(this, 'httpApi');
    httpApi.addRoutes({
      path: '/api',
      methods: [apiv2.HttpMethod.ANY],
      integration: new apiv2ing.HttpLambdaIntegration('func', func ),
    });
    const httpApiMapping = new apiv2.ApiMapping(this, 'httpApiMapping', {
      api: httpApi,
      domainName: cdomainName,
    });
    const cnameCustomdomain = new r53.CnameRecord(this, 'cnameCustomdomain', {
      zone: zone,
      domainName: cdomainName.regionalDomainName,
      recordName: domainName,
      ttl: Duration.minutes(5),
    });
    httpApiMapping.node.addDependency(httpApi);
    httpApiMapping.node.addDependency(cdomainName);
    cnameCustomdomain.node.addDependency(httpApi);
    cnameCustomdomain.node.addDependency(cdomainName);

    new CfnOutput(this, 'apiDomainName', {
      value: `curl https://${domainName}/api`,
    });
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new App();
new MyStack(app, 'domainapi-dev', { env: devEnv });
app.synth();