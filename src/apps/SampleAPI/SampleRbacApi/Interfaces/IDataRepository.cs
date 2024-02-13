namespace ApiRbac.Interfaces
{
    public interface IDataRepository
    {
        public Task<List<string>> listData(string token);
        public Task<bool> writeData(string? token, string bucketName, string keyName, string data);



    }
}
