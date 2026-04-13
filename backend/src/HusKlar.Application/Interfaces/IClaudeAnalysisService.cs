using HusKlar.Application.Features.ReportAnalysis.Dtos;

namespace HusKlar.Application.Interfaces;

public interface IClaudeAnalysisService
{
    Task<ReportAnalysisResultDto> AnalyseAsync(
        string extractedText,
        string reportType,
        CancellationToken cancellationToken = default);
}
