using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.RazorPages;
using WebPage.Contracts;

namespace WebPage.Pages.Account;

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
        var token = await HttpContext.GetTokenAsync("id_token");
        backendHttpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
        // Forecasts = (await backendHttpClient.GetFromJsonAsync<IList<WeatherForecast>>("/weatherforecast")) ?? [];
        _logger.LogDebug("Token: {Token}", token);
    }
}
