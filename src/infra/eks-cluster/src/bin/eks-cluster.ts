#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as blueprints from '@aws-quickstart/eks-blueprints';
import {AppsEcrImageStack} from '../lib/apps-ecr-images-stack';

const app = new cdk.App();
const version = 'auto';

const addOns: Array<blueprints.ClusterAddOn> = [
  new blueprints.addons.MetricsServerAddOn(),
  new blueprints.addons.ClusterAutoScalerAddOn(),
  new blueprints.addons.AwsLoadBalancerControllerAddOn(),
  new blueprints.addons.VpcCniAddOn(),
  new blueprints.addons.CoreDnsAddOn(),
  new blueprints.addons.KubeProxyAddOn(),
];

blueprints.EksBlueprint.builder()
  .version(version)
  .addOns(...addOns)
  .useDefaultSecretEncryption(true) // set to false to turn secret encryption off (non-production/demo cases)
  .build(app, 'demo-dotnet-cognito-eks-blueprint');

new AppsEcrImageStack(app, 'demo-dotnet-cognito-ecr-img', {});
