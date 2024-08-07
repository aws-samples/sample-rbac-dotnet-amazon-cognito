using System.Net.Http.Headers;
using System.Text.Json;
using Amazon.SecretsManager.Extensions.Caching;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddRazorPages();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});
// Add services to the container.
builder.Services.AddHttpClient("BackendAPIClient", httpClient =>
{
    httpClient.BaseAddress = new Uri("https://localhost:7229");
    httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    httpClient.DefaultRequestHeaders.Add(HeaderNames.UserAgent, "WebPage");
});

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
        options.SignedOutCallbackPath = "/signed-oidc";

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


Task OnRedirectToIdentityProviderForSignOut(RedirectContext context)
{
    SecretsManagerCache secretsManager = new();
    string clientSecret = secretsManager.GetSecretString("web-page-secrets").Result ?? "{}";
    var idConfig = JsonSerializer.Deserialize<RbacConfig>(clientSecret) ?? new();

    context.ProtocolMessage.ResponseType = OpenIdConnectResponseType.Code;
    var logoutUrl = $"{context.Request.Scheme}://{context.Request.Host}/";

    context.ProtocolMessage.IssuerAddress = $"{context.ProtocolMessage.IssuerAddress}?client_id={idConfig.ClientId}&logout_uri={logoutUrl}&redirect_uri={logoutUrl}";
    return Task.CompletedTask;
}

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

app.MapGet("SignOut", static async (HttpContext httpContext, [FromServices] OpenIdConnectHandler idConnnect) =>
{
    var props = (await httpContext.AuthenticateAsync()).Properties;

    await httpContext.SignOutAsync(props);
    await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme, props);
    await httpContext.SignOutAsync(OpenIdConnectDefaults.AuthenticationScheme, props);
    return Results.SignOut(props);

});


await app.RunAsync();

record RbacConfig
{
    public string Authority { get; set; } = string.Empty;
    public string IdentityPoolId { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
}