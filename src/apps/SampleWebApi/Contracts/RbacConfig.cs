namespace SampleWebApi.Contracts;
record RbacConfig
{
    public string Authority { get; set; } = string.Empty;
    public string IdentityPoolId { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string BucketName { get; set; } = string.Empty;
}