import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import {
  ManagedPolicy,
  Role,
  WebIdentityPrincipal,
  PolicyDocument,
} from "aws-cdk-lib/aws-iam";

export interface IamStackProps extends cdk.StackProps {
  IdentityPoolId: string;
}

export class IamStack extends cdk.Stack {
  WriteRoleArn: string;
  ListRoleArn: string;

  constructor(scope: Construct, id: string, props: IamStackProps) {
    super(scope, id, props);

    const uniq = new Date().getTime();

    const listpolicyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "s3:ListAllMyBuckets*",
          Resource: "*",
          Effect: "Allow",
          Sid: "VisualEditor0",
        },
      ],
    };

    const listcustomPolicyDocument =
      PolicyDocument.fromJson(listpolicyDocument);
    const listPolicy = new ManagedPolicy(this, "listpolicy", {
      document: listcustomPolicyDocument,
    });

    const s3ListRole = new Role(this, "s3-list-role", {
      roleName: "s3-list-role" + uniq,
      assumedBy: new WebIdentityPrincipal("cognito-identity.amazonaws.com", {
        StringEquals: {
          "cognito-identity.amazonaws.com:aud": `${props.IdentityPoolId}`,
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated",
        },
      }),
    });

    s3ListRole.addManagedPolicy(listPolicy);

    const writepolicyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "VisualEditor0",
          Effect: "Allow",
          Action: ["s3:PutObject"],
          Resource: "*",
        },
      ],
    };

    const writecustomPolicyDocument =
      PolicyDocument.fromJson(writepolicyDocument);

    const writePolicy = new ManagedPolicy(this, "writepolicy", {
      document: writecustomPolicyDocument,
    });

    const s3WriteRole = new Role(this, "s3-Write-role", {
      roleName: "s3writerole" + uniq,
      assumedBy: new WebIdentityPrincipal("cognito-identity.amazonaws.com", {
        StringEquals: {
          "cognito-identity.amazonaws.com:aud": `${props.IdentityPoolId}`,
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated",
        },
      }),
    });

    s3WriteRole.addManagedPolicy(writePolicy);

    this.ListRoleArn = s3ListRole.roleArn;
    this.WriteRoleArn = s3WriteRole.roleArn;
  }
}
