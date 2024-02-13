import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnOutput } from 'aws-cdk-lib';

import { 
  ManagedPolicy, 
  Role, 
  ServicePrincipal, 
  PolicyStatement, 
  Effect, 
  WebIdentityPrincipal,
  PrincipalWithConditions,
  PolicyDocument,
  Policy
} from 'aws-cdk-lib/aws-iam';

export class IamStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const uniq = (new Date()).getTime();

    const listpolicyDocument = {
      "Version": "2012-10-17",
      "Statement": [
          {
              "Action": "s3:ListAllMyBuckets*",
              "Resource": "*",
              "Effect": "Allow",
              "Sid": "VisualEditor0"
          }
      ]
  };
    
    
    
    const listcustomPolicyDocument = PolicyDocument.fromJson(listpolicyDocument);
    const listPolicy = new ManagedPolicy(this, 'listpolicy', {
      document: listcustomPolicyDocument,
    });

    const s3ListRole = new Role(this, 's3listrole', {
      roleName: 's3listrole'+uniq,
      assumedBy: new WebIdentityPrincipal('cognito-identity.amazonaws.com', {
        'StringEquals': {
          'cognito-identity.amazonaws.com:aud': '*',
         },
        'ForAnyValue:StringLike': {
          'cognito-identity.amazonaws.com:amr': 'authenticated',
        }
      })
    });

    s3ListRole.addManagedPolicy(listPolicy);
    
    
    



    const writepolicyDocument = {
      "Version": "2012-10-17",
      "Statement": [
          {
              "Sid": "VisualEditor0",
              "Effect": "Allow",
              "Action": [
                  "s3:PutObject"
              ],
              "Resource": "*"
          }
      ]
  };
    
    const writecustomPolicyDocument = PolicyDocument.fromJson(writepolicyDocument);

    const writePolicy = new ManagedPolicy(this, 'writepolicy', {
      document: writecustomPolicyDocument,
    });

    const s3WriteRole = new Role(this, 's3Writetrole', {
      roleName: 's3writerole'+uniq,
      assumedBy: new WebIdentityPrincipal('cognito-identity.amazonaws.com', {
        'StringEquals': {
          'cognito-identity.amazonaws.com:aud': '*',
         },
        'ForAnyValue:StringLike': {
          'cognito-identity.amazonaws.com:amr': 'authenticated',
        },
      })
    });

    s3WriteRole.addManagedPolicy(writePolicy);

    new CfnOutput(this, 'listRoleArn', {
      value: s3ListRole.roleArn,
      description: "role arn for list role",
      exportName: "listRoleArn",
    });

    new CfnOutput(this, 'writeRoleArn', {
      value: s3ListRole.roleArn,
      description: "role arn for list role",
      exportName: "writeRoleArn",
    });
  
  }

 
}
