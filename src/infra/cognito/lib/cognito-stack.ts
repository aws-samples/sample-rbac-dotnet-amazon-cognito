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
  WebClient: cdk.aws_cognito.UserPoolClient;
  UserPool: cdk.aws_cognito.UserPool;
  IdentityPool: cdk.aws_cognito.CfnIdentityPool;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const poolName = "rbacauthz";
    const region = Stack.of(this).region;
    const callBack = this.node.tryGetContext("callback");


       
  
 const bucket = new s3.Bucket(this, "MyBucket", {
  versioned: true, // Enable versioning
  removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production code
  enforceSSL: true,
  publicReadAccess: false,
  autoDeleteObjects: true,
});





    const userpool = new cognito.UserPool(this, "rbacUserPool", {
      userPoolName: poolName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const callbacks: string[] = [
      "https://localhost:7017/signin-oidc",
      "http://localhost:7017/signin-oidc",
      callBack,
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
        callbackUrls: callbacks,
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

    const listUser = new cognito.CfnUserPoolUser(this, "listPoolUser", {
      userPoolId: userpool.userPoolId,
      username: "listuser",
    });

    const writeUser = new cognito.CfnUserPoolUser(this, "writePoolUser", {
      userPoolId: userpool.userPoolId,
      username: "writeuser",
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

    identityPool.addDependency(listUser);
    identityPool.addDependency(writeUser);

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
        ClientSecret: webPageClient.userPoolClientSecret,
        Region: cdk.SecretValue.unsafePlainText(region),

      },
    });

  

    new CfnOutput(this, "Authority", {
      value: `https://cognito-idp.${region}.amazonaws.com/${userpool.userPoolId}`,
      description:
        "Authority name used for authorithy check by resource servers",
      exportName: "Auth",
    });


   /*  this.ClientId = webPageClient.userPoolClientId;
    this.UserPoolId = userpool.userPoolId;
    this.IdentityPoolId = identityPool.ref;
    this.WebClient = webApiClient;
    this.UserPool = userpool;
    this.IdentityPool = identityPool; */
  


    new CfnOutput(this, "AuthenticationURL", {
      value: `https://${domainName}.auth.${region}.amazoncognito.com/login?response_type=code&client_id=${webPageClient.userPoolClientId}&scope=phone email openid profile aws.cognito.signin.user.admin&redirect_uri=${callBack}`,
      description:
        "AuthenticationURL",
      exportName: "AuthenticationURL",
    });
    

    new CfnOutput(this, "Authority", {
      value: `https://cognito-idp.${region}.amazonaws.com/${userpool.userPoolId}`,
      description:
        "Authority name used for authorithy check by resource servers",
      exportName: "Auth",
    });


    new CfnOutput(this, "AccesstokenURL", {
      value: `https://${domainName}.auth.${region}.amazoncognito.com/oauth2/token`,
      description: "Access token URL",
      exportName: "TokenUrl",
    });

    new CfnOutput(this, "ClientId", {
      value: webPageClient.userPoolClientId,
      description: "client Id for Oauth flow",
      exportName: "CId",
    });

    new CfnOutput(this, '"IdentityPoolId', {
      value: identityPool.ref,
      description: "id of IdentityPool",
      exportName: "iPoolId",
    });

    new CfnOutput(this, '"providerName', {
      value: userpool.userPoolProviderName,
      description: "providerName",
      exportName: "providerName",
    });


    
    new CfnOutput(this, '"poolid', {
      value: userpool.userPoolId,
      description: "upoolId",
      exportName: "upoolId",
    });





  }
}
