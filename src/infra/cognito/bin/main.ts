#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CognitoStack } from "../lib/cognito-stack";
import { IamStack } from "../lib/iam-stack";
import { CognitoRoleMappingsStack } from "../lib/cognito-role-mappings";

const app = new cdk.App();

const cognitoStack: CognitoStack = new CognitoStack(
  app,
  "rbac-demo-congnito-stack",
  {}
);

const iamStack: IamStack = new IamStack(app, "rbac-demo-iam-stack", {
  IdentityPoolId: cognitoStack.IdentityPoolId,
});

iamStack.addDependency(cognitoStack);

cognitoMapping = new CognitoRoleMappingsStack(app, "rbac-demo-role-mappings-stack", {
});


