import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as _lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

export interface OverrideProps {
  lambdaContainerFunction: _lambda.DockerImageFunction;
  /**
   * Image config ENTRYPOINT.
   * @default - use Dockerfile define.
   */
  EntryPoint?: string[];

  /**
   * Image config CMD.
   * @default - use Dockerfile define. like app.handler.
   */
  Command?: string[];

  /**
   * Image config WORKDIR.
   * @default - /var/task.
   *
   */
  WorkingDirectory?: string;
}

export class Override extends Construct {
  constructor(scope: Construct, id: string, props: OverrideProps) {
    super(scope, id);
    const onEvent = new _lambda.DockerImageFunction(this, 'ECRFunctionApp', {
      code: _lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../custom-resource-handler')),
    });
    //const onEvent = new _lambda.Function(this, 'onEventHandler', {
    //  runtime: _lambda.Runtime.PYTHON_3_8,
    //  code: _lambda.Code.fromAsset(path.join(__dirname, '../custom-resource-handler')),
    //  handler: 'index.on_event',
    //});
    onEvent.role!.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ['lambda:UpdateFunctionConfiguration'],
        effect: iam.Effect.ALLOW,
        resources: [props.lambdaContainerFunction.functionArn],
      }),
    );
    const CRoverrideProvider = new cr.Provider(this, 'CRoverrideProvider', {
      onEventHandler: onEvent,
      logRetention: logs.RetentionDays.ONE_DAY,
    });

    const CRoverride = new cdk.CustomResource(this, 'CRoverride', {
      resourceType: 'Custom::ImageConfigOverride',
      serviceToken: CRoverrideProvider.serviceToken,
      properties: {
        lambdaContainerFunctionName: props.lambdaContainerFunction.functionName,
        EntryPoint: props.EntryPoint?.join(',') ?? undefined,
        Command: props.Command?.join(',') ?? undefined,
        WorkingDirectory: props.WorkingDirectory ?? undefined,
      },
    });
    CRoverride.node.addDependency(props.lambdaContainerFunction);
  }
}