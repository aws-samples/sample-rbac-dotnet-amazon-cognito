using System.Text.Json;
using Amazon.SecretsManager.Extensions.Caching;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();

// Add Authentication and Authorization services
builder.Services.AddAuthorization();
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
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
        };
        options.SaveTokens = true;
    });

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapRazorPages();


await app.RunAsync();

record RbacConfig
{
    public string Authority { get; set; } = string.Empty;
    public string IdentityPoolId { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}