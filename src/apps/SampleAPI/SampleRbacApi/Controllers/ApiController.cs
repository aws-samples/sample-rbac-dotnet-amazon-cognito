using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Amazon.CognitoIdentity;
using System.Security.Claims;
using Amazon;
using ApiRbac.Interfaces;
using Microsoft.Net.Http.Headers;
using Microsoft.AspNetCore.Authentication;
using Newtonsoft.Json;
using Amazon.CognitoIdentity.Model;
using Amazon.S3;
using System.Net.Http;
using static System.Net.Mime.MediaTypeNames;
using System.Text.Encodings.Web;
using Amazon.Runtime.Internal.Endpoints.StandardLibrary;
using Microsoft.AspNetCore.Http;
using Amazon.SecretsManager.Extensions.Caching;
using Newtonsoft.Json.Linq;


// For more information on enabling MVC for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace ApiRbac.Controllers
{
    [Route("[controller]/[action]")]
    [ApiController]

   
    public class ApiController : Controller
    {
        private readonly IConfiguration configuration;
        private readonly ILogger<ApiController> logger;
        private IDataRepository repository;
        private static HttpClient client = new HttpClient();

        public ApiController(IConfiguration configuration, ILogger<ApiController> logger, IDataRepository repository)
        {
            this.configuration = configuration;
            this.logger = logger;
            this.repository = repository;

        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> WriteData([FromForm] string content)
        {
            try
            {
                string? token = await HttpContext.GetTokenAsync("access_token");
                string? bucketName = configuration.GetValue<string>("Bucket:Name");

                var result = await repository.writeData(token, bucketName, content.Substring(0,3),content);

            }
            catch (AmazonS3Exception ex)
            {
                logger.LogError(ex.Message);
                return StatusCode(403);

            }
            catch (Exception ex)
            {
                logger.LogError(ex.Message);
                return StatusCode(500);

            }
            return Ok("done");
        }

       
        [HttpGet]
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

                if(code == null || clientId == null || redirectUri == null || tokenEndpoint == null || clientSecret == null)
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




                var s = await res.Content.ReadAsStringAsync();
                return Ok(s);

            }
            catch (AmazonS3Exception ex)
            {
                logger.LogError(ex.Message);
                return StatusCode(403);

            }
            catch (Exception ex)
            {
                logger.LogError(ex.Message);
                return StatusCode(500);

            }

        }






        [Authorize]
        [HttpGet]
        public async Task<IActionResult> ReadData()
        {
            try
            {
                string? token = await HttpContext.GetTokenAsync("access_token");

                var result = await repository.listData(token);
                if (result == null)
                {
                    return StatusCode(400);
                }

                return Ok(result);

            }
            catch (AmazonS3Exception ex)
            {
                logger.LogError(ex.Message);
                return StatusCode(403);

            }
            catch (Exception ex)
            {
                logger.LogError(ex.Message);
                return StatusCode(500);

            }
         
        }


    }
}

