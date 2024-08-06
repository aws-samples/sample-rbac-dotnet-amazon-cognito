import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { OAuthScope } from "aws-cdk-lib/aws-cognito";
import { ParameterTier, StringParameter } from "aws-cdk-lib/aws-ssm";
import { Stack, CfnOutput } from "aws-cdk-lib";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

export class CognitoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const uniq = new Date().getTime();
//    const listRoleArn = cdk.Fn.importValue("listRoleArn");
//    const writeRoleArn = cdk.Fn.importValue("writeRoleArn");
    const poolName = "rbacauthz" + uniq;
    const region = Stack.of(this).region;
    const callBack =  this.node.tryGetContext('callback');
    

    const userpool = new cognito.UserPool(this, "rbacUserPool", {
      userPoolName: poolName,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const callbacks: string[] = [
      "https://localhost:7017/signin-oidc",
      "http://localhost:7017/signin-oidc",
      callBack,
    ];

    const appClient = userpool.addClient("web-client", {
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

 

  

    //------------

    const writeUser = new cognito.CfnUserPoolUser(this, "writePoolUser", {
      userPoolId: userpool.userPoolId,
      username: "writeuser",
    });

  
    const identityPool = new cognito.CfnIdentityPool(this, "IdentityPool", {
      allowUnauthenticatedIdentities: false,

      cognitoIdentityProviders: [
        {
          clientId: appClient.userPoolClientId,
          providerName: userpool.userPoolProviderName,
          serverSideTokenCheck: true,
        },
      ],
    });

    

    identityPool.addDependency(listUser);
    identityPool.addDependency(writeUser);

    const authoriry = new StringParameter(this, "authority", {
      stringValue: `https://cognito-idp.${region}.amazonaws.com/${userpool.userPoolId}`,
      parameterName: "/security/oauth20/rbac/authority",
    });

    const identityPoolId = new StringParameter(this, "identityPoolId", {
      stringValue: identityPool.ref,
      parameterName: "/security/oauth20/rbac/identitypoolid",
    });


    new Secret(this, "web-page-secrets", {
      secretName: "web-page-secrets",
      secretObjectValue: {
        Authority: cdk.SecretValue.unsafePlainText(
          `https://cognito-idp.${region}.amazonaws.com/${userpool.userPoolId}`
        ),
        IdentityPoolId: cdk.SecretValue.unsafePlainText(identityPool.ref),
        ClientId: cdk.SecretValue.unsafePlainText(
          appClient.userPoolClientId
        ),
        ClientSecret: appClient.userPoolClientSecret,
        Region: cdk.SecretValue.unsafePlainText(region),

      },
    });

  
    const ClientId = new StringParameter(this, "clientId", {
      stringValue: appClient.userPoolClientId,
      parameterName: "/security/oauth20/rbac/clientid",
    });

    const clientSecret = new Secret(this, 'clientSecret', {
      secretName: 'rbacappclientsecret',
      secretObjectValue: {
        rbacclientsecret: appClient.userPoolClientSecret,   
      },
    });

    const tokenEndpoint = new StringParameter(this, "tokenEndpoint", {
      stringValue: `https://${domainName}.auth.${region}.amazoncognito.com/oauth2/token`,
      parameterName: "/security/oauth20/rbac/tokenendpoint",
    });

    

    const authEndpoint = new StringParameter(this, "authEndpoint", {
      stringValue: `https://${domainName}.auth.${region}.amazoncognito.com/login?response_type=code&client_id=${appClient.userPoolClientId}&scope=phone email openid profile aws.cognito.signin.user.admin&redirect_uri=${callBack}`,
      parameterName: "/security/oauth20/rbac/authendpoint",
    });

    const redirecturi = new StringParameter(this, "redirectUri", {
      stringValue: callBack,
      parameterName: "/security/oauth20/redirecturi",
    });
    
    new CfnOutput(this, "AuthenticationURL", {
      value: `https://${domainName}.auth.${region}.amazoncognito.com/login?response_type=code&client_id=${appClient.userPoolClientId}&scope=phone email openid profile aws.cognito.signin.user.admin&redirect_uri=${callBack}`,
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
      value: appClient.userPoolClientId,
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
