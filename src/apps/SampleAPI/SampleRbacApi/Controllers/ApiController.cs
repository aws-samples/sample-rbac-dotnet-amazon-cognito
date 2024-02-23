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

