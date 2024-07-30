import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { CfnOutput } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";

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

    const bucket = new s3.Bucket(this, "MyBucket", {
      versioned: true, // Enable versioning
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
      enforceSSL: true,
      publicReadAccess: false,
    });

    const bucketSSM = new StringParameter(this, "bucketName", {
      stringValue: bucket.bucketName,
      parameterName: "/security/oauth20/rbac/bucket",
    });

    const listGroup2 = new cognito.CfnUserPoolGroup(this, "listGroup2", {
      userPoolId: props.UserPoolId,
      description: "description",
      groupName: "list2",
      precedence: 0,
      roleArn: props.ListRoleArn,
    });

    const listAttach = new cognito.CfnUserPoolUserToGroupAttachment(
      this,
      "listAttachment",
      {
        groupName: listGroup2.groupName as string,
        username: "listuser",
        userPoolId: props.UserPoolId,
      }
    );

    listAttach.addDependency(listGroup2);

    const writeGroup2 = new cognito.CfnUserPoolGroup(this, "writeGroup2", {
      userPoolId: props.UserPoolId,
      description: "description",
      groupName: "write2",
      precedence: 0,
      roleArn: props.WriteRoleArn,
    });

    const writeAttach = new cognito.CfnUserPoolUserToGroupAttachment(
      this,
      "writeAttach",
      {
        groupName: writeGroup2.groupName as string,
        username: "writeuser",
        userPoolId: props.UserPoolId,
      }
    );

    writeAttach.addDependency(writeGroup2);

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
