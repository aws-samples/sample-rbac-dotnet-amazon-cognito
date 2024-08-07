using System.Text.Json;
using Amazon.SecretsManager.Extensions.Caching;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication;
using ApiRbac.Interfaces;
using ApiRbac.Repository;
using Amazon.S3;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// dependency injection for DataRepositoty layer
builder.Services.AddTransient<IDataRepository, DataRepository>();

builder.Services.AddHealthChecks();

//Add JWT
builder.Services.AddAuthorization();
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;

}).AddJwtBearer(options =>
{
    SecretsManagerCache secretsManager = new();
    string clientSecret = secretsManager.GetSecretString("web-page-secrets").Result ?? "{}";
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

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};


app.MapGet("/GetData", [Authorize]
async Task<IResult> (IDataRepository repository, HttpContext httpContext, ILogger<Program> logger) =>
{

    try
    {
        string? token = await httpContext.GetTokenAsync("access_token");

        if (token == null)
        {
            return Results.Forbid();
        }

        var result = await repository.listData(token);

        if (result == null)
        {
            return Results.BadRequest();
        }

        return Results.Ok(result);

    }
    catch (AmazonS3Exception ex)
    {
        logger.LogError(ex.Message);
        return Results.Forbid();

    }
    catch (Exception ex)
    {
        logger.LogError(ex.Message);
        return Results.Problem();

    }

    //   return Results.Ok(result);
})
.WithName("GetData")
.WithOpenApi();


app.MapPost("/WriteData", [Authorize]
async Task<IResult> (HttpRequest request, IDataRepository repository, HttpContext httpContext, ILogger<Program> logger) =>

{

    try
    {

        var content = await request.ReadFormAsync();

        var key = content.Keys.First();
        var data = content[key];

        SecretsManagerCache secretsManager = new();
        string clientSecret = secretsManager.GetSecretString("web-api-secrets").Result ?? "{}";
        var idConfig = JsonSerializer.Deserialize<RbacConfig>(clientSecret) ?? new();

        string? bucketName = idConfig.BucketName;

        string? token = await httpContext.GetTokenAsync("access_token");

        if (token == null)
        {
            return Results.Forbid();
        }

        var result = await repository.writeData(token, bucketName, "bucketKey", data); ;


        return Results.Ok(result);

    }
    catch (AmazonS3Exception ex)
    {
        logger.LogError(ex.Message);
        return Results.Forbid();

    }
    catch (Exception ex)
    {
        logger.LogError(ex.Message);
        return Results.Problem();

    }

    //   return Results.Ok(result);
})
.WithName("WriteData")
.WithOpenApi();



app.MapGet("/weatherforecast", [Authorize] () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast")
.WithOpenApi();

app.UseAuthentication();
app.UseAuthorization();

await app.RunAsync();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

record RbacConfig
{
    public string Authority { get; set; } = string.Empty;
    public string IdentityPoolId { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string BucketName { get; set; } = string.Empty;

}