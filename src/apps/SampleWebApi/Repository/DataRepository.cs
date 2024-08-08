using Amazon;
using Amazon.CognitoIdentity;
using Amazon.S3;
using Amazon.S3.Model;
using SampleWebApi.Contracts;
using System.Text.Json;
using Amazon.SecretsManager.Extensions.Caching;
using SampleWebApi.Interfaces;

namespace SampleWebApi.Repository;

public class DataRepository : IDataRepository
{
    private readonly IConfiguration configuration;
    private readonly ILogger<DataRepository> logger;
    private readonly SecretsManagerCache secretsManager;

    public DataRepository(IConfiguration configuration, ILogger<DataRepository> logger, SecretsManagerCache secretsManager)
    {
        this.configuration = configuration;
        this.logger = logger;
        this.secretsManager = secretsManager;
        BucketName = Environment.GetEnvironmentVariable("BUCKET_NAME");
    }

    public string? BucketName { get; private set; }

    public async Task<IList<string>> ListData(string token)
    {
        CognitoAWSCredentials credentials = TradeCognitoToken(token);
        IList<string> results = new List<string>();

        using (var s3Client = new AmazonS3Client(credentials))
        {
            var requestResult = await s3Client.ListObjectsV2Async(new ListObjectsV2Request
            {
                BucketName = BucketName,
                MaxKeys = 10,
                Prefix = "books/"
            });

            results = requestResult.S3Objects.Select(o => o.Key).ToList();
        }

        return results;
    }

    public async Task<bool> WriteData(string token, Book data)
    {
        bool succeed = false;
        byte[] memstring = JsonSerializer.SerializeToUtf8Bytes(data, new JsonSerializerOptions() { WriteIndented = true });
        CognitoAWSCredentials credentials = TradeCognitoToken(token);

        using (var memStream = new MemoryStream(memstring, true))
        {
            var s3 = new AmazonS3Client(credentials);
            using var tranUtility = new Amazon.S3.Transfer.TransferUtility(s3);
            var keyName = $"books/{data.Id}.json";
            await tranUtility.UploadAsync(memStream, BucketName, keyName);
            succeed = true;
        }

        return succeed;
    }

    private CognitoAWSCredentials TradeCognitoToken(string token)
    {
        string clientSecret = secretsManager.GetSecretString("web-page-secrets").Result ?? "{}";
        var idConfig = JsonSerializer.Deserialize<RbacConfig>(clientSecret) ?? new();

        string issuer = idConfig.Authority.Split("://")[1];
        string region = Environment.GetEnvironmentVariable("AWS_REGION") ?? "us-east-1";
        var regionEndpoint = configuration.GetAWSOptions().Region ?? RegionEndpoint.GetBySystemName(region);
        logger.LogInformation("Region: {Region}", regionEndpoint.ToString());

        var credentials = new CognitoAWSCredentials(idConfig.IdentityPoolId, regionEndpoint);
        credentials.AddLogin(issuer, token);
        return credentials;
    }
}