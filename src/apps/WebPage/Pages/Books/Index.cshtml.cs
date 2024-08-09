using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Extensions.Logging;
using WebPage.Contracts;

namespace WebPage.Pages.Books
{
    public class Index : PageModel
    {
        private readonly ILogger<Index> _logger;
        public IList<string> BooksData { get; set; }
        private readonly HttpClient backendHttpClient;


        public Index(ILogger<Index> logger, IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            backendHttpClient = httpClientFactory.CreateClient("BackendAPIClient");
            this.BooksData = [];
        }

        public async Task OnGetAsync()
        {
            try
            {
                var token = await HttpContext.GetTokenAsync("id_token");
                backendHttpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
                BooksData = (await backendHttpClient.GetFromJsonAsync<IList<string>>("/GetData")) ?? [];
            }
            catch (HttpRequestException e)
            {
                if (e.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                {
                    BooksData.Add("You are not authorized to list data from S3");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(message: "Fail to GetData", exception: ex);
            }
        }
    }
}