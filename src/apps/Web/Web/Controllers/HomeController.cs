using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using Web.Models;
using Amazon.SecretsManager.Extensions.Caching;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;
using System.Net.Http;

namespace Web.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> logger;
        private readonly IConfiguration configuration;
        private static HttpClient client = new HttpClient();

        public HomeController(ILogger<HomeController> logger, IConfiguration configuration)
        {
            this.logger = logger;
            this.configuration = configuration;       
        }

        public IActionResult Index()
        {
            return View();
        }


        public async Task<IActionResult> signinoidc()
        {
            try
            {

                string? code = HttpContext.Request.Query["code"];
                string? clientId = configuration["oauth20:rbac:clientid"];
                string? redirectUri = configuration["oauth20:redirecturi"];
                string? tokenEndpoint = configuration["oauth20:rbac:tokenendpoint"];
                SecretsManagerCache cache = new SecretsManagerCache();
                string? clientSecret = await cache.GetSecretString("rbacappclientsecret");

                if (code == null || clientId == null || redirectUri == null || tokenEndpoint == null || clientSecret == null)
                {
                    throw new ArgumentNullException();
                }


                JObject data = (JObject)JsonConvert.DeserializeObject(clientSecret);
                string clientKey = data["rbacclientsecret"].Value<string>();


                string authorization = clientId + ":" + clientKey;
                //string authorization = "6r080nkook14jt7ee7tgbvd5nj" + ":" + "12h423cbnoeg1lrapb4l33cnjpd9db6q777tdcjauu112e17usp2";
                var plainTextBytes = System.Text.Encoding.UTF8.GetBytes(authorization);
                string basicauth = System.Convert.ToBase64String(plainTextBytes);
                basicauth = "Basic " + basicauth;

                var dict = new Dictionary<string, string>();
                dict.Add("grant_type", "authorization_code");
                dict.Add("code", code);
                dict.Add("redirect_uri", redirectUri);
                // dict.Add("redirect_uri", "https://localhost:7123/api/signinoidc");

                var fcontent = new FormUrlEncodedContent(dict);
                fcontent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/x-www-form-urlencoded");



                // using var req = new HttpRequestMessage(HttpMethod.Post, "https://domainrbacauthz1708374965589.auth.us-east-1.amazoncognito.com/oauth2/token") { Content = fcontent };

                using var req = new HttpRequestMessage(HttpMethod.Post, tokenEndpoint) { Content = fcontent };


                //req.Headers = new MediaTypeHeaderValue("application/json");
                //req.Headers.Add("Content-Type", "application/x-www-form-urlencoded");
                req.Headers.Add("Authorization", basicauth);
                using var res = await client.SendAsync(req);

                string token  = await res.Content.ReadAsStringAsync();
                JObject t = (JObject)JsonConvert.DeserializeObject(token);
                string id_token = t["id_token"].Value<string>();
                HttpContext.Session.SetString("token", id_token);



                //return Ok(s);
                return View("Index");

            }
            catch (Exception ex)
            {
                logger.LogError(ex.Message);
                return StatusCode(500);

            }

        }

        public ActionResult Authenticate()
        {
            string? url = configuration["oauth20:rbac:authendpoint"];
            // ...
            return Redirect(url);
        }


        public async Task<IActionResult> GetBucket()
        {
            string? token = HttpContext.Session.GetString("token");
            string? authorization = "Bearer " + token;

            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            HttpResponseMessage response = await client.GetAsync("https://localhost:7123/api/readdata");
            ViewData["Message"] = response.StatusCode;

            return View("Index");
        }


        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
