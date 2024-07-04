using Amazon;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

builder.Services.AddDistributedMemoryCache();

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromSeconds(180);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});


var app = builder.Build();

string? Region = builder.Configuration.GetValue<string>("Region:Name");

if (Region == null)
{
    throw new NullReferenceException();
}

builder.Services.AddDistributedMemoryCache();



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



// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");



app.UseSession();

app.Run();
