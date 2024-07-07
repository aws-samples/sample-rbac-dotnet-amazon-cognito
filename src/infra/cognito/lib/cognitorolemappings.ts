import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { OAuthScope } from "aws-cdk-lib/aws-cognito";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Stack, CfnOutput } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";



export class CognitoRoleMappingsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

  
    const listRoleArn = cdk.Fn.importValue("listRoleArn");
    const writeRoleArn = cdk.Fn.importValue("writeRoleArn");
    const ipoolId = cdk.Fn.importValue("iPoolId");
    const upoolId = cdk.Fn.importValue("upoolId");
    const cid = cdk.Fn.importValue("CId");
    const region = Stack.of(this).region;

    const uniq = new Date().getTime();

    const bname = "rbacauthz"+uniq;


    const bucket = new s3.Bucket(this, 'MyBucket', {
      bucketName: bname,
      versioned: true,   // Enable versioning
      removalPolicy: cdk.RemovalPolicy.DESTROY,  // NOT recommended for production code
      enforceSSL: true, 
      publicReadAccess: false
    });

    const bucketSSM = new StringParameter(this, "bucketName", {
      stringValue: bname,
      parameterName: "/security/oauth20/rbac/bucket",
    });

 
  
      const listGroup2 = new cognito.CfnUserPoolGroup(this, "listGroup2", {
        userPoolId: upoolId,
        description: "description",
        groupName: "list2",
        precedence: 0,
        roleArn: listRoleArn,
      });
  

  
      const listAttach = new cognito.CfnUserPoolUserToGroupAttachment(
        this,
        "listAttachment",
        {
          groupName: listGroup2.groupName as string,
          username: "listuser",
          userPoolId: upoolId,
        }
      );

      listAttach.addDependency(listGroup2);
  
  
      const writeGroup2 = new cognito.CfnUserPoolGroup(this, "writeGroup2", {
        userPoolId: upoolId,
        description: "description",
        groupName: "write2",
        precedence: 0,
        roleArn: writeRoleArn,
      });
  
   
  
      const writeAttach = new cognito.CfnUserPoolUserToGroupAttachment(
        this,
        "writeAttach",
        {
          groupName: writeGroup2.groupName as string,
          username: "writeuser",
          userPoolId: upoolId,
        }
      );

      writeAttach.addDependency(writeGroup2);
  
   
  

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


    new CfnOutput(this, "userpoolid", {
        value: upoolId,
        description: "user pool id",
        exportName: "IPoolID",
      });

   
  

   
   

}




}

  
