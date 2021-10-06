import * as cdk from '@aws-cdk/core';
import * as assets from '@aws-cdk/aws-ecr-assets';
import * as apprunner from '@aws-cdk/aws-apprunner';
import * as path from 'path';

export class ApprunnerL2Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new apprunner.Service(this, 'demo', {
      source: apprunner.Source.fromAsset({
        asset: new assets.DockerImageAsset(this, 'assets', {
          directory: path.join(__dirname, '../service'),
        }),
      }),
      serviceName: 'demoapprunner',
    });
    
  }
}
