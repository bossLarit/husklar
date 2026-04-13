using System.Net;
using HusKlar.Application.Common;
using HusKlar.Application.Features.ReportAnalysis.Dtos;
using HusKlar.Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace HusKlar.Application.Features.ReportAnalysis.Commands.AnalyseReport;

public class AnalyseReportHandler : IRequestHandler<AnalyseReportCommand, Result<ReportAnalysisResultDto>>
{
    private readonly IPdfTextExtractor _pdfExtractor;
    private readonly IClaudeAnalysisService _claudeService;
    private readonly ILogger<AnalyseReportHandler> _logger;

    public AnalyseReportHandler(
        IPdfTextExtractor pdfExtractor,
        IClaudeAnalysisService claudeService,
        ILogger<AnalyseReportHandler> logger)
    {
        _pdfExtractor = pdfExtractor;
        _claudeService = claudeService;
        _logger = logger;
    }

    public async Task<Result<ReportAnalysisResultDto>> Handle(
        AnalyseReportCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Extracting text from {ReportType}", request.ReportType);
            var extractedText = await _pdfExtractor.ExtractTextAsync(request.PdfStream, cancellationToken);

            if (string.IsNullOrWhiteSpace(extractedText))
            {
                return Result<ReportAnalysisResultDto>.Fail(
                    "Kunne ikke læse tekst fra PDF-filen. Filen er muligvis scannet som billede. Prøv en anden fil.");
            }

            _logger.LogInformation(
                "Extracted {CharCount} characters, sending to Claude for analysis",
                extractedText.Length);

            var analysis = await _claudeService.AnalyseAsync(
                extractedText, request.ReportType, cancellationToken);

            return Result<ReportAnalysisResultDto>.Ok(analysis);
        }
        catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.Unauthorized)
        {
            _logger.LogError(ex, "Claude API authentication failed");
            return Result<ReportAnalysisResultDto>.Fail(
                "AI-tjenesten kunne ikke godkende forbindelsen. Kontakt support.");
        }
        catch (HttpRequestException ex) when ((int?)ex.StatusCode == 529 || ex.StatusCode == HttpStatusCode.TooManyRequests)
        {
            _logger.LogWarning(ex, "Claude API overloaded or rate limited");
            return Result<ReportAnalysisResultDto>.Fail(
                "AI-tjenesten er midlertidigt overbelastet. Vent venligst et minut og prøv igen.");
        }
        catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.BadRequest)
        {
            _logger.LogError(ex, "Claude API bad request");
            return Result<ReportAnalysisResultDto>.Fail(
                "Rapporten kunne ikke analyseres. Filen er muligvis for stor eller i et uventet format.");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Claude API request failed with status {Status}", ex.StatusCode);
            return Result<ReportAnalysisResultDto>.Fail(
                "Kunne ikke forbinde til AI-tjenesten. Prøv venligst igen om lidt.");
        }
        catch (TaskCanceledException)
        {
            return Result<ReportAnalysisResultDto>.Fail(
                "Analysen tog for lang tid og blev afbrudt. Prøv igen med en kortere rapport.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during report analysis");
            return Result<ReportAnalysisResultDto>.Fail(
                "Der opstod en uventet fejl. Prøv venligst igen.");
        }
    }
}
