using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using WebPage.Contracts;

namespace WebPage.Pages.Books
{

    [Authorize(Policy = "ReadWriteRole")]
    public class CreatePage : PageModel
    {
        private readonly ILogger<CreatePage> _logger;
        private readonly HttpClient backendHttpClient;

        [BindProperty]
        public Book? BookForm { get; set; }

        public CreatePage(ILogger<CreatePage> logger, IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            backendHttpClient = httpClientFactory.CreateClient("BackendAPIClient");

        }

        public void OnGet()
        {
        }

        public async Task<IActionResult> OnPostAsync()
        {

            if (!ModelState.IsValid)
            {
                return Page();
            }

            var token = await HttpContext.GetTokenAsync("id_token");
            backendHttpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
            await backendHttpClient.PostAsJsonAsync("/WriteData", BookForm);

            return RedirectToPage("./Index");
        }
    }
}