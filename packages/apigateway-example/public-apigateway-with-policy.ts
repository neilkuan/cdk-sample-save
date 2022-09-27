import { CfnOutput, Lazy } from 'aws-cdk-lib';
import * as apigwv1 from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';


export interface PublicApiGatewayProps {
  vpc: ec2.IVpc;
  handler: lambda.Function;
  eips: ec2.CfnEIP[];
}
export class PublicApiGateway extends Construct {
  constructor(scope: Construct, id: string, props: PublicApiGatewayProps) {
    super(scope, id);
    /**
     * apigateV2 HttpApi not support, put apigateway in vpc (private api).
     */
    const apiV1 = new apigwv1.RestApi(this, 'PublicApiGateway', {
      endpointConfiguration: {
        types: [
          apigwv1.EndpointType.REGIONAL,
        ],
      },
      policy: new iam.PolicyDocument({
        assignSids: true,
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'execute-api:Invoke',
            ],
            principals: [new iam.AnyPrincipal()],
            resources: ['execute-api:/*'],
            conditions: {
              IpAddress: {
                'aws:SourceIp': Lazy.any({
                  produce: () => {
                    let eips32: any[] = [];
                    props.eips.forEach(eip => {
                      eips32.push(eip.ref + '/32');
                    });
                    /**
                     * eips32 for nat gatewat eips...
                     * 211.23.39.139/32 for company ip...
                     * props.vpc.vpcCidrBlock for vpcip range...
                     */
                    return [...eips32];
                  },
                }),
              },
            },
          }),
        ],
      }),
    });

    const v1 = apiV1.root.addResource('v1');
    const hello = v1.addResource('hello');
    hello.addMethod('GET', new apigwv1.LambdaIntegration(props.handler));
    hello.addMethod('POST', new apigwv1.LambdaIntegration(props.handler));

    new CfnOutput(this, 'api', {
      value: apiV1.url,
    });
  }
}