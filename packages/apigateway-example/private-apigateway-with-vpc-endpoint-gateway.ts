import { Stack, CfnOutput, Tags } from 'aws-cdk-lib';
import * as apigwv1 from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';


export interface PrivateApiGatewayProps {
  vpc: ec2.IVpc;
  handler: lambda.Function;
}
export class PrivateApiGateway extends Construct {
  constructor(scope: Construct, id: string, props: PrivateApiGatewayProps) {
    super(scope, id);
    const executeApiEndpoint = new ec2.InterfaceVpcEndpoint(this, 'executeApiEndpoint', {
      service: new ec2.InterfaceVpcEndpointService(
        `com.amazonaws.${Stack.of(this).region}.execute-api`, 443),
      /**
       * Default Private subnet only.
       * VPC endpoint subnets should be in different availability zones supported by the VPC endpoint service.
       */
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      privateDnsEnabled: true,
      vpc: props.vpc,
    });

    Tags.of(executeApiEndpoint).add('Name', 'PrivateApiGatewayApiEndpoint');

    /**
     * Default policy
     */
    // executeApiEndpoint.addToPolicy(
    //   new iam.PolicyStatement({
    //     actions: ['*'],
    //     resources: ['*'],
    //     principals: [new iam.AnyPrincipal()],
    //   }),
    // );

    /**
     * apigateV2 HttpApi not support, put apigateway in vpc (private api).
     */
    const apiV1 = new apigwv1.RestApi(this, 'PrivateApiGateway', {
      endpointConfiguration: {
        types: [
          apigwv1.EndpointType.PRIVATE,
        ],
        vpcEndpoints: [executeApiEndpoint],
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
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.DENY,
            actions: [
              'execute-api:Invoke',
            ],
            principals: [new iam.AnyPrincipal()],
            resources: ['execute-api:/*'],
            conditions: {
              StringNotEquals: {
                'aws:SourceVpc': props.vpc.vpcId,
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