import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";

import { Construct } from "constructs";
import { CfnOutput } from "aws-cdk-lib";

export interface CongnitoRoleMappingsStack extends cdk.StackProps {
  IdentityPoolId: string;
  IamReadWriteRoleArn: string;
  IamReadOnlyRoleArn: string;
  UserPoolId: string;
  ClientId: string;
}

export class CognitoRoleMappingsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CongnitoRoleMappingsStack) {
    super(scope, id, props);

    const readOnlyUser = new cognito.CfnUserPoolUser(this, "read-only-user", {
      userPoolId: props.UserPoolId,
      username: "bob",
    });

    const readOnlyGroup = new cognito.CfnUserPoolGroup(
      this,
      "read-only-group",
      {
        userPoolId: props.UserPoolId,
        description: "Illustrates read-only user groups",
        groupName: "read-only-group",
        precedence: 0,
        roleArn: props.IamReadOnlyRoleArn,
      }
    );

    const readOnlyAttach = new cognito.CfnUserPoolUserToGroupAttachment(
      this,
      "read-only-attach",
      {
        groupName: readOnlyGroup.groupName as string,
        username: readOnlyUser.username as string,
        userPoolId: props.UserPoolId,
      }
    );

    readOnlyAttach.addDependency(readOnlyUser);
    readOnlyAttach.addDependency(readOnlyGroup);

    const readWriteUser = new cognito.CfnUserPoolUser(this, "read-write-user", {
      userPoolId: props.UserPoolId,
      username: "sarah",
    });

    const readWriteGroup = new cognito.CfnUserPoolGroup(
      this,
      "read-write-group",
      {
        userPoolId: props.UserPoolId,
        description: "Illustrates read-write user groups",
        groupName: "read-write-group",
        precedence: 0,
        roleArn: props.IamReadWriteRoleArn,
      }
    );

    const readWriteAttach = new cognito.CfnUserPoolUserToGroupAttachment(
      this,
      "read-write-attach",
      {
        groupName: readWriteGroup.groupName as string,
        username: readWriteUser.username as string,
        userPoolId: props.UserPoolId,
      }
    );

    readWriteAttach.addDependency(readWriteUser);
    readWriteAttach.addDependency(readWriteGroup);

    const roles = new Map<string, string>([
      ["role1", props.IamReadOnlyRoleArn],
      ["role2", props.IamReadWriteRoleArn],
    ]);

    new cognito.CfnIdentityPoolRoleAttachment(
      this,
      "IdentityPoolRoleAttachment",
      {
        identityPoolId: props.IdentityPoolId,
        roleMappings: {
          roleMappingsKey: {
            type: "Token",
            identityProvider: `cognito-idp.${this.region}.amazonaws.com/${props.UserPoolId}:${props.ClientId}`,
            ambiguousRoleResolution: "AuthenticatedRole",
          },
        },
        roles: roles,
      }
    );

    new CfnOutput(this, "userpoolid", {
      value: props.UserPoolId,
      description: "user pool id",
      exportName: "IPoolID",
    });
  }
}
