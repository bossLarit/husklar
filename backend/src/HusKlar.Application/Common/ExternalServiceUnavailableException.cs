namespace HusKlar.Application.Common;

/// <summary>
/// Thrown when an external service is completely unavailable and no partial
/// response is possible. Callers should translate this to a user-friendly
/// error message, not a fallback value.
/// </summary>
public class ExternalServiceUnavailableException : Exception
{
    public ExternalServiceUnavailableException(string serviceName)
        : base($"External service '{serviceName}' is unavailable") { }
}
