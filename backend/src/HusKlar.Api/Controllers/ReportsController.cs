using HusKlar.Application.Features.ReportAnalysis.Commands.AnalyseReport;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HusKlar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReportsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("upload")]
    [EnableRateLimiting("ReportUpload")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10MB
    public async Task<IActionResult> Upload(
        IFormFile? file,
        [FromForm] string? type,
        CancellationToken cancellationToken)
    {
        // Verify bearer token from Authorization header
        if (!AuthController.IsValidToken(Request.Headers.Authorization))
        {
            return Unauthorized(ApiError("Du skal logge ind for at bruge rapport-analysen."));
        }

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

        using var stream = file.OpenReadStream();
        var command = new AnalyseReportCommand(stream, type);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.Success)
        {
            return UnprocessableEntity(ApiError(result.Error!));
        }

        return Ok(new { data = result.Data, error = (string?)null, success = true });
    }

    private static object ApiError(string message) =>
        new { data = (object?)null, error = message, success = false };
}
