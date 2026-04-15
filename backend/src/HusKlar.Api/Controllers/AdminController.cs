using System.Security.Cryptography;
using System.Text;
using HusKlar.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace HusKlar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private const int MaxCodesPerRequest = 50;
    private const int MaxNoteLength = 200;

    private readonly string? _masterPassword;
    private readonly ICodesRepository _codes;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        IConfiguration configuration,
        ICodesRepository codes,
        ILogger<AdminController> logger)
    {
        _masterPassword = configuration["MASTER_PASSWORD"];
        _codes = codes;
        _logger = logger;
    }

    [HttpPost("codes")]
    public async Task<IActionResult> GenerateCodes(
        [FromBody] GenerateRequest request,
        CancellationToken cancellationToken)
    {
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        if (AuthController.IsLockedOut(clientIp))
        {
            return StatusCode(429, ApiError("For mange mislykkede forsøg. Prøv igen om 15 minutter."));
        }

        if (string.IsNullOrEmpty(_masterPassword))
        {
            return StatusCode(500, ApiError("Admin-funktioner er ikke konfigureret på serveren."));
        }

        if (!IsMasterPasswordValid(request.MasterPassword ?? string.Empty, _masterPassword))
        {
            AuthController.RecordFailedAttempt(clientIp);
            return Unauthorized(ApiError("Forkert master-password."));
        }

        AuthController.ClearFailedAttempts(clientIp);

        if (request.Count < 1 || request.Count > MaxCodesPerRequest)
        {
            return BadRequest(ApiError($"Antal skal være mellem 1 og {MaxCodesPerRequest}."));
        }

        var note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        if (note is { Length: > MaxNoteLength })
        {
            return BadRequest(ApiError($"Note må være maks {MaxNoteLength} tegn."));
        }

        try
        {
            var codes = await _codes.GenerateAsync(request.Count, note, cancellationToken);
            _logger.LogInformation("Admin genererede {Count} koder (note: {Note})", codes.Count, note ?? "-");

            return Ok(new
            {
                data = new { codes },
                error = (string?)null,
                success = true,
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "Kunne ikke generere koder");
            return StatusCode(503, ApiError(
                "Database er ikke konfigureret. Sæt DATABASE_URL env var for at aktivere engangs-koder."));
        }
    }

    private static bool IsMasterPasswordValid(string submitted, string master)
    {
        var submittedBytes = Encoding.UTF8.GetBytes(submitted);
        var masterBytes = Encoding.UTF8.GetBytes(master);
        if (submittedBytes.Length != masterBytes.Length) return false;
        return CryptographicOperations.FixedTimeEquals(submittedBytes, masterBytes);
    }

    private static object ApiError(string message) =>
        new { data = (object?)null, error = message, success = false };

    public record GenerateRequest(string? MasterPassword, int Count, string? Note);
}
