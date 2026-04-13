using System.Collections.Concurrent;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;

namespace HusKlar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly string? _accessCode;

    // Simple in-memory token store (for hobby project — use Redis/DB for production)
    private static readonly ConcurrentDictionary<string, DateTime> ValidTokens = new();

    // Brute-force protection: track failed attempts by IP
    private static readonly ConcurrentDictionary<string, (int Count, DateTime LastAttempt)> FailedAttempts = new();

    private const int MaxFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan TokenLifetime = TimeSpan.FromHours(24);

    public AuthController(IConfiguration configuration)
    {
        _accessCode = configuration["REPORT_ACCESS_CODE"];
    }

    [HttpPost("verify")]
    public IActionResult Verify([FromBody] VerifyRequest request)
    {
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        // Check lockout
        if (IsLockedOut(clientIp))
        {
            return StatusCode(429, new
            {
                data = (object?)null,
                error = "For mange mislykkede forsøg. Prøv igen om 15 minutter.",
                success = false
            });
        }

        if (string.IsNullOrEmpty(_accessCode))
        {
            return StatusCode(500, new
            {
                data = (object?)null,
                error = "Adgangskode er ikke konfigureret på serveren.",
                success = false
            });
        }

        // Constant-time comparison to prevent timing attacks
        if (!CryptographicOperations.FixedTimeEquals(
                System.Text.Encoding.UTF8.GetBytes(request.Code ?? ""),
                System.Text.Encoding.UTF8.GetBytes(_accessCode)))
        {
            RecordFailedAttempt(clientIp);
            return Unauthorized(new
            {
                data = (object?)null,
                error = "Forkert adgangskode.",
                success = false
            });
        }

        // Clear failed attempts on success
        FailedAttempts.TryRemove(clientIp, out _);

        // Generate secure token
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        ValidTokens[token] = DateTime.UtcNow.Add(TokenLifetime);

        // Clean expired tokens periodically
        CleanExpiredTokens();

        return Ok(new
        {
            data = new { token, expiresIn = (int)TokenLifetime.TotalSeconds },
            error = (string?)null,
            success = true
        });
    }

    /// <summary>
    /// Validates a token from the Authorization header. Used by other controllers.
    /// </summary>
    public static bool IsValidToken(string? authHeader)
    {
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            return false;

        var token = authHeader["Bearer ".Length..];

        if (!ValidTokens.TryGetValue(token, out var expiry))
            return false;

        if (DateTime.UtcNow > expiry)
        {
            ValidTokens.TryRemove(token, out _);
            return false;
        }

        return true;
    }

    private static bool IsLockedOut(string clientIp)
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

    private static void RecordFailedAttempt(string clientIp)
    {
        FailedAttempts.AddOrUpdate(
            clientIp,
            _ => (1, DateTime.UtcNow),
            (_, existing) => (existing.Count + 1, DateTime.UtcNow));
    }

    private static void CleanExpiredTokens()
    {
        var now = DateTime.UtcNow;
        foreach (var (token, expiry) in ValidTokens)
        {
            if (now > expiry)
                ValidTokens.TryRemove(token, out _);
        }
    }

    public record VerifyRequest(string? Code);
}
