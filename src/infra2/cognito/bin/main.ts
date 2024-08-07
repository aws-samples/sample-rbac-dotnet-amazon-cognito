#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CognitoStack } from "../lib/cognito-stack";
import { IamStack } from "../lib/iam-stack";
import { CognitoRoleMappingsStack } from "../lib/cognito-role-mappings";

const app = new cdk.App();


const cognitoStack: CognitoStack = new CognitoStack(app, "congnitoStack", {
  env: { region: region },
});

const iamStack: IamStack = new IamStack(app, "iamStack", {
  env: { region: region },
});

const cognitorolemappings: CognitoRoleMappingsStack = new CognitoRoleMappingsStack(
  app,
  "cognitoRoleMappingsStack",
  {
    env: { region: region },
  }
);

iamStack.addDependency(cognitoStack);
cognitorolemappings.addDependency(iamStack);


