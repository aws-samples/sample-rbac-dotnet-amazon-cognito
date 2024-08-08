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

    const listpolicyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Action: ["s3:GetObject", "s3:GetBucketLocation", "s3:ListBucket"],
          Resource: [
            "arn:aws:s3:::rbac-demo-role-mappings-stack-mybucketf68f3ff0-uud8wyv0vmat/*",
            "arn:aws:s3:::rbac-demo-role-mappings-stack-mybucketf68f3ff0-uud8wyv0vmat",
          ],
          Effect: "Allow",
          Sid: "AllowRead",
        },
      ],
    };

    const listcustomPolicyDocument =
      PolicyDocument.fromJson(listpolicyDocument);
    const listPolicy = new ManagedPolicy(this, "listpolicy", {
      document: listcustomPolicyDocument,
    });

    const s3ListRole = new Role(this, "s3-list-role", {
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
          Sid: "AllowWrite",
          Effect: "Allow",
          Action: ["s3:PutObject"],
          Resource: [
            "arn:aws:s3:::rbac-demo-role-mappings-stack-mybucketf68f3ff0-uud8wyv0vmat/*",
            "arn:aws:s3:::rbac-demo-role-mappings-stack-mybucketf68f3ff0-uud8wyv0vmat",
          ],
        },
        {
          Action: ["s3:GetObject", "s3:GetBucketLocation", "s3:ListBucket"],
          Resource: [
            "arn:aws:s3:::rbac-demo-role-mappings-stack-mybucketf68f3ff0-uud8wyv0vmat/*",
            "arn:aws:s3:::rbac-demo-role-mappings-stack-mybucketf68f3ff0-uud8wyv0vmat",
          ],
          Effect: "Allow",
          Sid: "AllowRead",
        },
      ],
    };

    const writecustomPolicyDocument =
      PolicyDocument.fromJson(writepolicyDocument);

    const writePolicy = new ManagedPolicy(this, "writepolicy", {
      document: writecustomPolicyDocument,
    });

    const s3WriteRole = new Role(this, "s3-Write-role", {
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
