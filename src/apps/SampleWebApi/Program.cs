using System.Text.Json;
using Amazon.SecretsManager.Extensions.Caching;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication;
using Amazon.S3;
using Amazon.SecretsManager;
using SampleWebApi.Contracts;
using Microsoft.AspNetCore.Mvc;
using SampleWebApi.Repository;
using SampleWebApi.Interfaces;

var builder = WebApplication.CreateBuilder(args);

Environment.SetEnvironmentVariable("BUCKET_NAME", "rbac-demo-role-mappings-stack-mybucketf68f3ff0-uud8wyv0vmat");

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// dependency injection for DataRepositoty layer
builder.Services.AddTransient<IDataRepository, DataRepository>();
builder.Services.AddDefaultAWSOptions(builder.Configuration.GetAWSOptions());
builder.Services.AddAWSService<IAmazonSecretsManager>();
builder.Services.AddSingleton<SecretsManagerCache>();

builder.Services.AddHealthChecks();

//Add JWT
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ReaderOnlyRole", policy => policy.RequireClaim("cognito:groups", "reader", "write2"));
    options.AddPolicy("WriterOnlyRole", policy => policy.RequireClaim("cognito:groups", "write2"));
});
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

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapGet("/GetData", [Authorize(Policy = "ReaderOnlyRole")] async Task<IResult> (
    IDataRepository repository,
    HttpContext httpContext,
    ILogger<Program> logger) =>
{
    IList<string> result = [];
    try
    {
        string? token = await httpContext.GetTokenAsync("access_token");

        if (httpContext.User.Identity?.IsAuthenticated != true || string.IsNullOrWhiteSpace(token))
        {
            return Results.Forbid();
        }

        result = await repository.ListData(token);

        if (result == null)
        {
            return Results.BadRequest();
        }
    }
    catch (AmazonS3Exception ex)
    {
        logger.LogError(message: "Fail to list buckets", exception: ex);
        return Results.Forbid();
    }
    catch (Exception ex)
    {
        logger.LogError(message: "Fail to list buckets", exception: ex);
        return Results.Problem();
    }

    return Results.Ok(result);
})
.WithName("GetData")
.WithOpenApi();


app.MapPost("/WriteData", [Authorize(Policy = "WriterOnlyRole")] async Task<IResult> (
    [FromBody] Book book,
    IDataRepository repository,
    HttpContext httpContext,
    ILogger<Program> logger) =>
{
    try
    {
        string? token = await httpContext.GetTokenAsync("access_token");
        if (httpContext.User.Identity?.IsAuthenticated != true || string.IsNullOrWhiteSpace(token))
        {
            return Results.Forbid();
        }

        var result = await repository.WriteData(token, book);

        return Results.Ok(result);
    }
    catch (AmazonS3Exception ex)
    {
        logger.LogError(message: "Fail write to the bucket", exception: ex);
        return Results.Forbid();
    }
    catch (Exception ex)
    {
        logger.LogError(message: "Fail write to the bucket", exception: ex);
        return Results.Problem();
    }
})
.WithName("WriteData")
.WithOpenApi();

app.UseAuthentication();
app.UseAuthorization();

await app.RunAsync();