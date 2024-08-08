using SampleWebApi.Contracts;

namespace SampleWebApi.Interfaces;

public interface IDataRepository
{
    public Task<IList<string>> ListData(string token);
    public Task<bool> WriteData(string token, Book data);
}

