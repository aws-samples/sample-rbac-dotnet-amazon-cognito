# Sample RBAC Dotnet Amazon Cognito

## Summary

This design pattern describes and implements an OAuth 2.0 authorization code grant flow doing a RBAC based authorization in .NET 8.0 API consuming AWS services with temporary credentials, having **AWS cognito** as the identity provider. It also demonstrates the  OAuth 2.0 flow with postman, providing a seamless developer experience allowing development and debugging AWS cloud API security scenarios.

## Prerequisites

- AWS Account
- AWS Console
- .NET framework 8.0
- Visual Studio 2022 community edition ( optional for a developer experience using Microsoft tool)
- AWS CDK
- Postman tool for API testing (optional)
- AWS Cognito
- AWS Systems Manager Parameter store
  
## Deployment

### Deployment of Cognito User pool , Identity Pool, Security Policies  Users and Groups and Parameter Store

1. From the root of the project folder Navigate to src\infra\cognito and run the following commands:

```bash
cdk bootstrap --all

cdk deploy --all
```

The following output will be produced. Save this data for later user

```bash
congnitoStack.AccesstokenURL = accesstokenURL
congnitoStack.AuthenticationURL = authenticationURL
congnitoStack.Authority = Authority
congnitoStack.IdentityPoolId = identityPoold
congnitoStack.providerName = providerName
```

2. Obtain the client secret in the AWS console:
2.1. Open AWS console select cognito.
2.2. Click on User pools on the left select the user pool.
2.3. Select **App Integrarion**. Scroll down and click on the App Client.
2.4. Click on **Show Client Secret**. Save value for later use.

### Assign Passwords to users

Assign passwords for the users listuser, reader writeuser created by the cognito deployment passing the poolid from previous output and the password of your choice with the following commands:

Note: the flag —permanent is passed. Use —temporary to allow users to change the password on first login

```bash
export USER_POOL_ID=$(aws cognito-idp list-user-pools --max-results 10 |  jq ".UserPools[] | select(.Name == \"rbacauthz\") | .Id" -r)

aws cognito-idp admin-set-user-password --user-pool-id $USER_POOL_ID --username listuser --pass REPLACE_THIS_PLACEHOLDER_PASSWORD --permanent
aws cognito-idp admin-set-user-password --user-pool-id $USER_POOL_ID --username writeuser --pass REPLACE_THIS_PLACEHOLDER_PASSWORD --permanent
```

### Create a bucket for testing

```bash
aws s3api create-bucket --bucket bucketName --region region
```

### PostMan Testing with an OAUTH2.0 Authorization Code Grant Flow

An authenticated context is required to debug locally. Authenticate to AWS and from the command propmpt type devenv to launch visucal studio

change the bucketname and region in app settings

```bash
  "Region": {
    "Name": "region"
  },
  "Bucket": {
    "Name":  "bucketname"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}

```

1. Start Postman and login to your account.

2. On Postman click on Workspaces at the top and select your workspace.

3. On the right side on your workspace click on **Import** button.

4. Select upload files then navigate to folder src\apps\SampleApi\SampleRbacApi\Tools and select OAUTH20_ENV.postman_environment.json then click open.

5. Again on the workspace click on click on **Import** button.

6. Select upload files then navigate to folder root/tools and select RbacAuthz.postman_collection.json then click open.

7. Click on Collections on the left side panel and select RbacAuthz then on the top right side where it says No Environment select **OAUTH20_ENV** from the drop down list.

8. Click on Environments on the left side panel and select OAUTH20_ENV.

9. Edit and save the following environment variables on the right side with the outputs of your deployments.

10. OAUTH20_AUTH_URL  value from output cognitoStack.AuthenticationURL

CLIENT_ID value from  output cognitoStack.ClientId

CLIENT_SECRET value AWS console

SERVICE_ENDTPOINT value from output of debug console in visual stutio  

CALL_BACK_URL no change

OAUTH20_ACCESS_URL value from output  cognitoStack.AccesstokenURL

OAUTH20.SCOPES no change

11. Click at the root of the collection RbacAuthz scroll down this UI on Postman until GetNewAccessToken is visible and click it. Enter listuser as user and the password click sign in then click proceed then use token.  

12. Click on the ReadData request under root of collection, select Authorization select type and then oauth. On the token drop down expand the available tokens and choose your token. On the **Token Type** and choose Id token.

13. Click at the root of the collection RbacAuthz scroll down this UI on Postman until GetNewAccessToken is visible and click it. Enter writeuser as user and the password click sign in then click proceed then use token.  

12. Click on the WriteData request under root of collection, select Authorization select type and then oauth. On the token drop down expand the available tokens and choose your token. On the **Token Type** and choose Id token.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
