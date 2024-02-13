import * as cdk from 'aws-cdk-lib';
import * as ecrAssets from 'aws-cdk-lib/aws-ecr-assets';
import {Construct} from 'constructs';
import path = require('path');

export class AppsEcrImageStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const asset = new ecrAssets.DockerImageAsset(this, 'sample-api-image', {
      directory: path.join(__dirname, '../../../../apps/SampleAPI'),
      assetName: 'sample-api',
      file: 'Dockerfile',
      platform: ecrAssets.Platform.LINUX_AMD64,
    });

    //TODO: Add Cognito here

    new cdk.CfnOutput(this, 'imageUri', {value: asset.imageUri});
  }
}
