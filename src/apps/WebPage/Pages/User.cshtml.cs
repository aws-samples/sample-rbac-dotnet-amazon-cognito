using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;
using WebPage.Contracts;

namespace WebPage.Pages;

[Authorize]
public class User : PageModel
{
    private readonly ILogger<User> _logger;
    private readonly HttpClient backendHttpClient;

    public IList<WeatherForecast> Forecasts { get; set; } = [];

    public User(ILogger<User> logger, IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        backendHttpClient = httpClientFactory.CreateClient("BackendAPIClient");
    }

    public async Task OnGetAsync()
    {
        //Make HTTP request to http://localhost:5287 
        var token = await HttpContext.GetTokenAsync("access_token");
        backendHttpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
        Forecasts = (await backendHttpClient.GetFromJsonAsync<IList<WeatherForecast>>("/weatherforecast")) ?? [];
        _logger.LogInformation("Toke: {Toke}", token);
    }
}
