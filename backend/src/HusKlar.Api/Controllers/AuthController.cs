using System.Collections.Concurrent;
using System.Security.Cryptography;
using HusKlar.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HusKlar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly string? _ownerCode;
    private readonly ICodesRepository _codes;

    // Brute-force protection: track failed attempts by IP (shared with other controllers via FailedAttempts.Record)
    private static readonly ConcurrentDictionary<string, (int Count, DateTime LastAttempt)> FailedAttempts = new();

    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    public AuthController(IConfiguration configuration, ICodesRepository codes)
    {
        _ownerCode = configuration["REPORT_ACCESS_CODE"];
        _codes = codes;
    }

    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] VerifyRequest request, CancellationToken cancellationToken)
    {
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        if (IsLockedOut(clientIp))
        {
            return StatusCode(429, ApiError("For mange mislykkede forsøg. Prøv igen om 15 minutter."));
        }

        var submitted = request.Code ?? string.Empty;

        if (await IsValidCodeAsync(submitted, cancellationToken))
        {
            FailedAttempts.TryRemove(clientIp, out _);
            return Ok(new
            {
                data = new { valid = true },
                error = (string?)null,
                success = true,
            });
        }

        RecordFailedAttempt(clientIp);
        return Unauthorized(ApiError("Forkert adgangskode."));
    }

    /// <summary>
    /// Checks if a code is an owner-code (REPORT_ACCESS_CODE env var) or a valid unused
    /// code in the database. Does NOT consume the code.
    /// </summary>
    private async Task<bool> IsValidCodeAsync(string submitted, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrEmpty(_ownerCode) && IsOwnerCode(submitted, _ownerCode))
        {
            return true;
        }

        try
        {
            return await _codes.IsValidAsync(submitted, cancellationToken);
        }
        catch (InvalidOperationException)
        {
            // Database not configured — only owner-code flow available
            return false;
        }
    }

    public static bool IsOwnerCode(string submitted, string ownerCode)
    {
        var submittedBytes = System.Text.Encoding.UTF8.GetBytes(submitted);
        var ownerBytes = System.Text.Encoding.UTF8.GetBytes(ownerCode);
        if (submittedBytes.Length != ownerBytes.Length) return false;
        return CryptographicOperations.FixedTimeEquals(submittedBytes, ownerBytes);
    }

    public static bool IsLockedOut(string clientIp)
    {
        if (!FailedAttempts.TryGetValue(clientIp, out var record))
            return false;

        if (DateTime.UtcNow - record.LastAttempt > LockoutDuration)
        {
            FailedAttempts.TryRemove(clientIp, out _);
            return false;
        }

        return record.Count >= MaxFailedAttempts;
    }

    public static void RecordFailedAttempt(string clientIp)
    {
        FailedAttempts.AddOrUpdate(
            clientIp,
            _ => (1, DateTime.UtcNow),
            (_, existing) => (existing.Count + 1, DateTime.UtcNow));
    }

    public static void ClearFailedAttempts(string clientIp)
    {
        FailedAttempts.TryRemove(clientIp, out _);
    }

    private static object ApiError(string message) =>
        new { data = (object?)null, error = message, success = false };

    public record VerifyRequest(string? Code);
}
