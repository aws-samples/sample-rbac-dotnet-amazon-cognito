using Amazon;
using Amazon.CognitoIdentity;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Net.Http.Headers;

using ApiRbac.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Runtime.Intrinsics.Arm;
using System.Security.Claims;
using System.Text;
using System.Reflection.Metadata.Ecma335;
using System.Text.Json;
using Amazon.SecretsManager.Extensions.Caching;

namespace ApiRbac.Repository
{
    public class DataRepository : IDataRepository
    {
        private readonly IConfiguration configuration;
        private readonly ILogger<DataRepository> logger;
 

        public DataRepository(IConfiguration configuration, ILogger<DataRepository> logger) //, IAmazonS3 s3Service)
        {
            this.configuration = configuration;
            this.logger = logger;
        }

        public async Task<List<string>> listData(string? token)
        {
            // Cognito Identity Pool ID
            // Cognito isuer that is the authorirty 
            // they are used in CognitoAWSCredentials and addLogin
            SecretsManagerCache secretsManager = new();
            string clientSecret = secretsManager.GetSecretString("web-api-secrets").Result ?? "{}";
            var idConfig = JsonSerializer.Deserialize<RbacConfig>(clientSecret) ?? new();

            //   string? issuer = configuration["oauth20:rbac:authority"];
            //string? identityPool = configuration["oauth20:rbac:identitypoolid"];
            string? identityPool = idConfig.IdentityPoolId;
            string? issuer = idConfig.Authority;
            string? region = idConfig.Region;

        
            if (issuer == null || identityPool == null)
            {
                throw new Exception("configuration exception");
            }


            if (issuer.StartsWith("https://", StringComparison.InvariantCultureIgnoreCase)) issuer = issuer.Substring("https://".Length);
            if (issuer.StartsWith("http://", StringComparison.InvariantCultureIgnoreCase)) issuer = issuer.Substring("http://".Length);
            CognitoAWSCredentials credentials = new CognitoAWSCredentials(identityPool, RegionEndpoint.GetBySystemName(region));
           

            credentials.AddLogin(issuer, token);

            
            ListBucketsResponse buckets;

            using (var s3Client = new AmazonS3Client(credentials))
            {
                buckets = await s3Client.ListBucketsAsync();
            }


            List<string> results = buckets.Buckets.ToList().Select(e => e.BucketName).ToList();

            return results;
         
        
        }


        public async Task<bool> writeData(string? token, string bucketName, string keyName, string data)
        {
            bool succeed = false;

            UnicodeEncoding uniEncoding = new UnicodeEncoding();
            byte[] memstring = uniEncoding.GetBytes(data);


            // Cognito Identity Pool ID
            // Cognito isuer that is the authorirty 
            // they are used in CognitoAWSCredentials and addLogin

            string? identityPool = configuration["oauth20:rbac:identitypoolid"];
            string? issuer = configuration["oauth20:rbac:authority"];
            if (issuer == null || identityPool == null)
            {
                throw new Exception("configuration exception");
            }

            if (issuer.StartsWith("https://", StringComparison.InvariantCultureIgnoreCase)) issuer = issuer.Substring("https://".Length);
            if (issuer.StartsWith("http://", StringComparison.InvariantCultureIgnoreCase)) issuer = issuer.Substring("http://".Length);
            CognitoAWSCredentials credentials = new CognitoAWSCredentials(identityPool, RegionEndpoint.GetBySystemName(configuration.GetValue<string>("Region:Name")));


            credentials.AddLogin(issuer, token);

            using (MemoryStream memStream = new MemoryStream(100))
            {
                memStream.Write(memstring, 0, memstring.Length);

                // upload to s3
            
                    AmazonS3Client s3 = new AmazonS3Client(credentials);
                    using (Amazon.S3.Transfer.TransferUtility tranUtility =
                                  new Amazon.S3.Transfer.TransferUtility(s3))
                    {

                         await tranUtility.UploadAsync(memStream, bucketName, keyName);
                         succeed = true;

                    
                    }
                }

            return succeed;

        }  
        
        
    }


}
