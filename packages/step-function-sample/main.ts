import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class MyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps = {}) {
    super(scope, id, props);
    const purchase = new lambda.Function(this, 'purchaseFun', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.purchase_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda')),
      functionName: 'purchaseFun',
    });
    const refund = new lambda.Function(this, 'refundFun', {
      runtime: lambda.Runtime.PYTHON_3_8,
      handler: 'index.refund_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, './lambda')),
      functionName: 'refundFun',
    });
    const choice = new sfn.Choice(this, 'demoChoice', {
      comment: 'Transaction Processor State Machine',
    } );

    const invokePurchase = new tasks.LambdaInvoke(this, 'Invokepurchase', { lambdaFunction: purchase });
    const invokeRefund = new tasks.LambdaInvoke(this, 'Invokerefund', { lambdaFunction: refund });
    choice.when(sfn.Condition.stringEquals('$.TransactionType', 'PURCHASE'), invokePurchase);
    choice.when(sfn.Condition.stringEquals('$.TransactionType', 'REFUND'), invokeRefund);

    const chain = sfn.Chain.start(choice);
    const machine = new sfn.StateMachine(this, 'StateMachine', {
      definition: chain,
      stateMachineName: 'StateMachineDemo',
      timeout: cdk.Duration.seconds(30),
    });
    purchase.grantInvoke(machine);
    refund.grantInvoke(machine);
  }
}

const devEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();

new MyStack(app, 'step-func-dev', { env: devEnv });

app.synth();