import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { OAuthScope } from "aws-cdk-lib/aws-cognito";
import { Stack, CfnOutput } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import * as s3 from "aws-cdk-lib/aws-s3";

export class CognitoStack extends cdk.Stack {
  IdentityPoolId: string;
  UserPoolId: string;
  ClientId: string;
  SampleBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const poolName = "rbacauthz";
    const region = Stack.of(this).region;

    const userpool = new cognito.UserPool(this, "rbacUserPool", {
      userPoolName: poolName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const callbacks: string[] = [
      "http://localhost:7017/signin-oidc",
      "https://localhost:7016/signin-oidc",
      "https://localhost:7017/signin-oidc",
      "https://localhost:7176/home/signinoidc",
    ];

    const signoutURLs: string[] = [
      "https://localhost:7016/",
      "https://localhost:7016/SignOut",
      "https://localhost:7017/",
      "https://localhost:7017/SignOut",
    ];

    const webPageClient = userpool.addClient("web-page-client", {
      generateSecret: true,
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        callbackUrls: callbacks,
        scopes: [
          OAuthScope.PHONE,
          OAuthScope.EMAIL,
          OAuthScope.OPENID,
          OAuthScope.PROFILE,
          OAuthScope.COGNITO_ADMIN,
        ],
        logoutUrls: signoutURLs,
      },
      authFlows: {
        adminUserPassword: true,
        custom: true,
        userPassword: true,
        userSrp: true,
      },
    });

    const webApiClient = userpool.addClient("web-api-client", {
      generateSecret: true,
      oAuth: {
        scopes: [
          OAuthScope.PHONE,
          OAuthScope.EMAIL,
          OAuthScope.OPENID,
          OAuthScope.PROFILE,
          OAuthScope.COGNITO_ADMIN,
        ],
      },
    });

    const domainName = "domain" + poolName;

    userpool.addDomain(domainName, {
      cognitoDomain: {
        domainPrefix: domainName,
      },
    });

    const identityPool = new cognito.CfnIdentityPool(this, "IdentityPool", {
      allowUnauthenticatedIdentities: false,

      cognitoIdentityProviders: [
        {
          clientId: webPageClient.userPoolClientId,
          providerName: userpool.userPoolProviderName,
          serverSideTokenCheck: true,
        },
        {
          clientId: webApiClient.userPoolClientId,
          providerName: userpool.userPoolProviderName,
          serverSideTokenCheck: true,
        },
      ],
    });

    this.SampleBucket = new s3.Bucket(this, "sample-bucket", {
      versioned: true, // Enable versioning
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
      autoDeleteObjects: true, // NOT recommended for production code
      enforceSSL: true,
      publicReadAccess: false,
    });

    new Secret(this, "web-page-secrets", {
      secretName: "web-page-secrets",
      secretObjectValue: {
        Authority: cdk.SecretValue.unsafePlainText(
          `https://cognito-idp.${region}.amazonaws.com/${userpool.userPoolId}`
        ),
        IdentityPoolId: cdk.SecretValue.unsafePlainText(identityPool.ref),
        ClientId: cdk.SecretValue.unsafePlainText(
          webPageClient.userPoolClientId
        ),
        BucketName: cdk.SecretValue.unsafePlainText(
          this.SampleBucket.bucketName
        ),
        Region: cdk.SecretValue.unsafePlainText(region),
        ClientSecret: webPageClient.userPoolClientSecret,
      },
    });

    new Secret(this, "web-api-secrets", {
      secretName: "web-api-secrets",
      secretObjectValue: {
        Authority: cdk.SecretValue.unsafePlainText(
          `https://cognito-idp.${region}.amazonaws.com/${userpool.userPoolId}`
        ),
        IdentityPoolId: cdk.SecretValue.unsafePlainText(identityPool.ref),
        ClientId: cdk.SecretValue.unsafePlainText(
          webApiClient.userPoolClientId
        ),
        BucketName: cdk.SecretValue.unsafePlainText(
          this.SampleBucket.bucketName
        ),
        Region: cdk.SecretValue.unsafePlainText(region),
        ClientSecret: webApiClient.userPoolClientSecret,
      },
    });

    new CfnOutput(this, "Authority", {
      value: `https://cognito-idp.${region}.amazonaws.com/${userpool.userPoolId}`,
      description:
        "Authority name used for authorithy check by resource servers",
      exportName: "Auth",
    });

    this.ClientId = webPageClient.userPoolClientId;
    this.UserPoolId = userpool.userPoolId;
    this.IdentityPoolId = identityPool.ref;
  }
}
