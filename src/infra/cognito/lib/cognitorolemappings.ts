import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { OAuthScope } from "aws-cdk-lib/aws-cognito";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Stack, CfnOutput } from "aws-cdk-lib";

export class CognitoRoleMappingsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

  
    const listRoleArn = cdk.Fn.importValue("listRoleArn");
    const writeRoleArn = cdk.Fn.importValue("writeRoleArn");
    const ipoolId = cdk.Fn.importValue("iPoolId");
    const upoolId = cdk.Fn.importValue("upoolId");
    const cid = cdk.Fn.importValue("CId");
    const region = Stack.of(this).region;

    const listUser = new cognito.CfnUserPoolUser(this, "listPoolUser", {
        userPoolId: upoolId,
        username: "listuser",
      });
  
      const listGroup = new cognito.CfnUserPoolGroup(this, "listGroup", {
        userPoolId: upoolId,
        description: "description",
        groupName: "list",
        precedence: 0,
        roleArn: listRoleArn,
      });
  
      listGroup.addDependency(listUser);
  
      const listAttach = new cognito.CfnUserPoolUserToGroupAttachment(
        this,
        "listAttachment",
        {
          groupName: listGroup.groupName as string,
          username: listUser.username as string,
          userPoolId: upoolId,
        }
      );
  
      listAttach.addDependency(listGroup);
  
      //------------
  
      const writeUser = new cognito.CfnUserPoolUser(this, "writePoolUser", {
        userPoolId: upoolId,
        username: "writeuser",
      });
  
      const writeGroup = new cognito.CfnUserPoolGroup(this, "writeGroup", {
        userPoolId: upoolId,
        description: "description",
        groupName: "write",
        precedence: 0,
        roleArn: writeRoleArn,
      });
  
      writeGroup.addDependency(writeUser);
  
      const writeAttach = new cognito.CfnUserPoolUserToGroupAttachment(
        this,
        "writeAttach",
        {
          groupName: writeGroup.groupName as string,
          username: writeUser.username as string,
          userPoolId: upoolId,
        }
      );
  
      writeAttach.addDependency(writeGroup);
  

    const roles = new Map<string, string>([
        ["role1", listRoleArn],
        ["role2", writeRoleArn],
      ]);
  
    const cfnIdentityPoolRoleAttachment =
    new cognito.CfnIdentityPoolRoleAttachment(
        this,
        "IdentityPoolRoleAttachment",
        {
        identityPoolId: ipoolId,

        // the properties below are optional
        roleMappings: {
            roleMappingsKey: {
            type: "Token",
            identityProvider: `cognito-idp.${region}.amazonaws.com/${upoolId}:${cid}`,
            ambiguousRoleResolution: "AuthenticatedRole",
            },
        },
        roles: roles,
        }
    );


    new CfnOutput(this, "identitypool", {
        value: "ipoolId",
        description: "identity pool",
        exportName: "IPool ID",
      });

   
  

   
   

}




}

  
