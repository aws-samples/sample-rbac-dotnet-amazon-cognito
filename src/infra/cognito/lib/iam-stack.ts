import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface IamStackProps extends cdk.StackProps {
  IdentityPoolId: string;
  SampleBucket: s3.Bucket;
}

export class IamStack extends cdk.Stack {
  ReadWriteRoleArn: string;
  ReadOnlyRoleArn: string;

  constructor(scope: Construct, id: string, props: IamStackProps) {
    super(scope, id, props);

    const readOnlyRole = new iam.Role(this, "s3-read-role", {
      assumedBy: new iam.WebIdentityPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": `${props.IdentityPoolId}`,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        }
      ),
    });

    readOnlyRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject", "s3:GetBucketLocation", "s3:ListBucket"],
        resources: [
          props.SampleBucket.arnForObjects("*"),
          props.SampleBucket.bucketArn,
        ],
        effect: iam.Effect.ALLOW,
        sid: "AllowRead",
      })
    );

    const readWriteRole = new iam.Role(this, "s3-read-Write-role", {
      assumedBy: new iam.WebIdentityPrincipal(
        "cognito-identity.amazonaws.com",
        {
          StringEquals: {
            "cognito-identity.amazonaws.com:aud": `${props.IdentityPoolId}`,
          },
          "ForAnyValue:StringLike": {
            "cognito-identity.amazonaws.com:amr": "authenticated",
          },
        }
      ),
    });

    readWriteRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "s3:PutObject",
          "s3:GetObject",
          "s3:GetBucketLocation",
          "s3:ListBucket",
        ],
        resources: [
          props.SampleBucket.arnForObjects("*"),
          props.SampleBucket.bucketArn,
        ],
        effect: iam.Effect.ALLOW,
        sid: "AllowReadWrite",
      })
    );

    this.ReadOnlyRoleArn = readOnlyRole.roleArn;
    this.ReadWriteRoleArn = readWriteRole.roleArn;
  }
}
