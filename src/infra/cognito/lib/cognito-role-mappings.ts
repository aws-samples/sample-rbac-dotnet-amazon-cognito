import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { CfnOutput } from "aws-cdk-lib";

export interface CongnitoRoleMappingsStack extends cdk.StackProps {
  IdentityPoolId: string;
  WriteRoleArn: string;
  ListRoleArn: string;
  UserPoolId: string;
  ClientId: string;
}

export class CognitoRoleMappingsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CongnitoRoleMappingsStack) {
    super(scope, id, props);

    const listUser = new cognito.CfnUserPoolUser(this, "listPoolUser", {
      userPoolId: props.UserPoolId,
      username: "bob",
    });

    const writeUser = new cognito.CfnUserPoolUser(this, "writePoolUser", {
      userPoolId: props.UserPoolId,
      username: "sarah",
    });

    const listGroup = new cognito.CfnUserPoolGroup(this, "listGroup", {
      userPoolId: props.UserPoolId,
      description: "description",
      groupName: "ReadOnlyUserGroup",
      precedence: 0,
      roleArn: props.ListRoleArn,
    });

    const listAttach = new cognito.CfnUserPoolUserToGroupAttachment(
      this,
      "listAttachment",
      {
        groupName: listGroup.groupName as string,
        username: listUser.username as string,
        userPoolId: props.UserPoolId,
      }
    );

    listAttach.addDependency(listGroup);

    const writeGroup = new cognito.CfnUserPoolGroup(this, "writeGroup", {
      userPoolId: props.UserPoolId,
      description: "description",
      groupName: "WriteReadUserGroup",
      precedence: 0,
      roleArn: props.WriteRoleArn,
    });

    const writeAttach = new cognito.CfnUserPoolUserToGroupAttachment(
      this,
      "writeAttach",
      {
        groupName: writeGroup.groupName as string,
        username: writeUser.username as string,
        userPoolId: props.UserPoolId,
      }
    );

    writeAttach.addDependency(writeGroup);

    const roles = new Map<string, string>([
      ["role1", props.ListRoleArn],
      ["role2", props.WriteRoleArn],
    ]);

    const cfnIdentityPoolRoleAttachment =
      new cognito.CfnIdentityPoolRoleAttachment(
        this,
        "IdentityPoolRoleAttachment",
        {
          identityPoolId: props.IdentityPoolId,

          // the properties below are optional
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
