namespace HusKlar.Application.Common;

public class Result<T>
{
    public T? Data { get; }
    public string? Error { get; }
    public bool Success { get; }

    private Result(T data)
    {
        Data = data;
        Success = true;
    }

    private Result(string error)
    {
        Error = error;
        Success = false;
    }

    public static Result<T> Ok(T data) => new(data);
    public static Result<T> Fail(string error) => new(error);
}
