using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Amazon;
using Amazon.S3;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ApiRbac.Interfaces;
using ApiRbac.Repository;
using Amazon.CognitoIdentity;
using Microsoft.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);

WebApplication app;

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
string? Region = builder.Configuration.GetValue<string>("Region:Name");

if (Region == null)
{
    throw new NullReferenceException();
}



// add AWS system manager to fetch authority
// and identity provider data
// path /security in SSM
//under security is oauth20:rbac:authority for authority
// under security is oauth20:rbac:identitypoolid for identity
builder.Configuration.AddSystemsManager(source =>
{
    source.Path = "/security";
    source.Optional = true;
    source.ReloadAfter = TimeSpan.FromSeconds(600);
    source.AwsOptions = new Amazon.Extensions.NETCore.Setup.AWSOptions()
    {

        Region = RegionEndpoint.GetBySystemName(Region),

    };
});

IConfiguration configuration = builder.Configuration;
builder.Services.AddTransient<IDataRepository, DataRepository>();
//builder.Services.AddAWSService<CognitoAWSCredentials>();
// oauth20:rbac:authority


builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.Authority = configuration["oauth20:rbac:authority"];

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = configuration["oauth20:rbac:authority"],
        ValidateLifetime = true,
        LifetimeValidator = (before, expires, token, param) => expires > DateTime.UtcNow,
        ValidateAudience = false,
    };
    options.SaveToken = true;
});

builder.Services.AddHealthChecks();

app = builder.Build();


app.UseSwagger();
app.UseSwaggerUI();
app.UseHttpsRedirection();
app.MapControllers();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/healthz")
    .AllowAnonymous();
app.UsePathBase("/api/app1");
app.MapGet("/", [AllowAnonymous] () => "Welcome to running ASP.NET Core Minimal API on EKS with Amazon Cognito");

app.Run();


























//------------


//var builder = WebApplication.CreateBuilder(args);

//// Add services to the container.

//builder.Services.AddControllers();
//// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
//builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSwaggerGen();

//var app = builder.Build();

//// Configure the HTTP request pipeline.
//if (app.Environment.IsDevelopment())
//{
//    app.UseSwagger();
//    app.UseSwaggerUI();
//}

//app.UseHttpsRedirection();

//app.UseAuthorization();

//app.MapControllers();

//app.Run();
