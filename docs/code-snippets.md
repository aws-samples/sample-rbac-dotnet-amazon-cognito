# Sample code for the blog post

## Code placeholder 01: IAM Role

```ts
...
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
...
```

## Code Placeholder 02: Cognito User Group

```ts
...
const readWriteUser = new cognito.CfnUserPoolUser(this, "read-write-user", {
  userPoolId: props.UserPoolId,
  username: "sarah",
});

const readWriteGroup = new cognito.CfnUserPoolGroup(
  this,
  "read-write-group",
  {
    userPoolId: props.UserPoolId,
    description: "Illustrates read-write user groups",
    groupName: "read-write-group",
    precedence: 0,
    roleArn: props.IamReadWriteRoleArn,
  }
);

const readWriteAttach = new cognito.CfnUserPoolUserToGroupAttachment(
  this,
  "read-write-attach",
  {
    groupName: readWriteGroup.groupName as string,
    username: readWriteUser.username as string,
    userPoolId: props.UserPoolId,
  }
);
...
```

## Code Placeholder 03: .NET Role mapping

```cs
...
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ReadOnlyRole", policy => policy.RequireClaim("cognito:groups", "read-only-group", "read-write-group"));
    options.AddPolicy("ReadWriteRole", policy => policy.RequireClaim("cognito:groups", "read-write-group"));
});
...
```

## Code Placeholder 04: Authorization notation

```cs
//Razor Page
[Authorize(Policy = "ReadWriteRole")]
public class CreatePage : PageModel
{
    ...
    public void OnGet()
    {
    }
    ...
}

//Web API
app.MapGet("/GetData", [Authorize(Policy = "ReadOnlyRole")] async Task<IResult> (...) =>
{
    ...
    return Results.Ok(result);
})
.WithName("GetData")
.WithOpenApi();
```

## Code Placeholder 05: Set up OpenID Connect on Razor Page

```cs
...
builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
    })
    .AddCookie()
    .AddOpenIdConnect(options =>
    {
        SecretsManagerCache secretsManager = new();
        string clientSecret = secretsManager.GetSecretString("web-page-secrets").Result ?? "{}";
        var idConfig = JsonSerializer.Deserialize<RbacConfig>(clientSecret) ?? new();

        options.MetadataAddress = idConfig.Authority + "/.well-known/openid-configuration";
        options.ClientId = idConfig.ClientId;
        options.ClientSecret = idConfig.ClientSecret;
        options.Authority = idConfig.Authority;
        options.CallbackPath = "/signin-oidc";
        options.ResponseType = OpenIdConnectResponseType.Code;
        options.SignedOutCallbackPath = "/signedout-oidc";
        options.UseTokenLifetime = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
        };
        options.SaveTokens = true;
        options.Events = new OpenIdConnectEvents
        {
            OnRedirectToIdentityProviderForSignOut = OnRedirectToIdentityProviderForSignOut
        };
    });

var app = builder.Build();
...
app.UseAuthentication();
app.UseAuthorization();
app.MapRazorPages();
...
await app.RunAsync();
```

## Code placeholder 06: JWT

```cs
...
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;

}).AddJwtBearer(options =>
{
    SecretsManagerCache secretsManager = new();
    string clientSecret = secretsManager.GetSecretString("web-api-secrets").Result ?? "{}";
    var idConfig = JsonSerializer.Deserialize<RbacConfig>(clientSecret) ?? new();

    options.Authority = idConfig.Authority;
    options.MetadataAddress = idConfig.Authority + "/.well-known/openid-configuration";

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = idConfig.Authority,
        ValidateLifetime = true,
        LifetimeValidator = (before, expires, token, param) => expires.HasValue && expires.Value > DateTime.UtcNow,
        ValidateAudience = false,
        ValidateIssuerSigningKey = true,
    };
});
...
var app = builder.Build();
...
app.UseAuthentication();
app.UseAuthorization();

await app.RunAsync();
```

## Code placeholder 07: CDK deployment

```bash
cd src/infra/cognito
npm install
cdk bootstrap --all
cdk synth --all
cdk deploy --require-approval never --all 
```

## Code placeholder 08: Set user password

```bash
export USER_POOL_ID=$(aws cognito-idp list-user-pools --max-results 10 |  jq ".UserPools[] | select(.Name == \"rbacauthz\") | .Id" -r)

aws cognito-idp admin-set-user-password --user-pool-id $USER_POOL_ID --username bob --pass "Abc,123#098" --permanent
aws cognito-idp admin-set-user-password --user-pool-id $USER_POOL_ID --username sarah --pass Abc,123#098 --permanent
```

## Code placeholder 09: Terminal 1

```bash
cd src/apps/SampleWebApi
dotnet dev-certs https
dotnet build
dotnet run
```

## Code placeholder 10: Terminal 2

```bash
cd src/apps/WebPage 
dotnet build
dotnet watch
```

## Code placeholder 11: Cleanup

```bash
cd src/infra/cognito
cdk destroy --all
```
