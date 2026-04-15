using HusKlar.Application.Features.ReportAnalysis.Commands.AnalyseReport;
using HusKlar.Application.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HusKlar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICodesRepository _codes;
    private readonly string? _ownerCode;

    public ReportsController(IMediator mediator, ICodesRepository codes, IConfiguration configuration)
    {
        _mediator = mediator;
        _codes = codes;
        _ownerCode = configuration["REPORT_ACCESS_CODE"];
    }

    [HttpPost("upload")]
    [EnableRateLimiting("ReportUpload")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10MB
    public async Task<IActionResult> Upload(
        IFormFile? file,
        [FromForm] string? type,
        CancellationToken cancellationToken)
    {
        // 1. Access code — via header (X-Access-Code) or form field (code)
        var accessCode = Request.Headers["X-Access-Code"].ToString();
        if (string.IsNullOrEmpty(accessCode))
        {
            accessCode = Request.Form["code"].ToString();
        }

        if (string.IsNullOrEmpty(accessCode))
        {
            return Unauthorized(ApiError("Adgangskode mangler."));
        }

        // 2. Cheap input validation (before consuming any codes)
        if (file is null || file.Length == 0)
        {
            return BadRequest(ApiError("Ingen fil uploadet. Vælg venligst en PDF-fil."));
        }

        if (file.ContentType != "application/pdf")
        {
            return BadRequest(ApiError("Kun PDF-filer er tilladt. Den uploadede fil er ikke en gyldig PDF."));
        }

        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest(ApiError("Filen er for stor. Maksimum er 10 MB."));
        }

        if (type is not ("tilstandsrapport" or "elrapport"))
        {
            return BadRequest(ApiError("Vælg venligst rapporttype: tilstandsrapport eller elrapport."));
        }

        // Magic-bytes check — ContentType is attacker-controlled, so verify %PDF signature.
        await using (var peek = file.OpenReadStream())
        {
            var header = new byte[4];
            var read = await peek.ReadAsync(header.AsMemory(0, 4), cancellationToken);
            if (read < 4 || header[0] != 0x25 || header[1] != 0x50 || header[2] != 0x44 || header[3] != 0x46)
            {
                return BadRequest(ApiError("Filen er ikke en gyldig PDF."));
            }
        }

        // 3. Consume code (or verify owner-code which is never consumed)
        var isOwner = !string.IsNullOrEmpty(_ownerCode)
                      && AuthController.IsOwnerCode(accessCode, _ownerCode);

        if (!isOwner)
        {
            bool consumed;
            try
            {
                consumed = await _codes.TryConsumeAsync(accessCode, cancellationToken);
            }
            catch (InvalidOperationException)
            {
                // DATABASE_URL not configured — only owner-code works
                return Unauthorized(ApiError("Ugyldig adgangskode."));
            }

            if (!consumed)
            {
                return Unauthorized(ApiError("Ugyldig eller allerede brugt adgangskode."));
            }
        }

        // 4. Run analysis. Refund on any failure so user keeps their code.
        try
        {
            using var stream = file.OpenReadStream();
            var command = new AnalyseReportCommand(stream, type);
            var result = await _mediator.Send(command, cancellationToken);

            if (!result.Success)
            {
                await RefundIfNeededAsync(isOwner, accessCode);
                return UnprocessableEntity(ApiError(result.Error!));
            }

            return Ok(new { data = result.Data, error = (string?)null, success = true });
        }
        catch
        {
            await RefundIfNeededAsync(isOwner, accessCode);
            throw;
        }
    }

    private async Task RefundIfNeededAsync(bool isOwner, string accessCode)
    {
        if (isOwner) return;
        try
        {
            await _codes.RefundAsync(accessCode, CancellationToken.None);
        }
        catch
        {
            // Best-effort refund; don't mask the original error.
        }
    }

    private static object ApiError(string message) =>
        new { data = (object?)null, error = message, success = false };
}
