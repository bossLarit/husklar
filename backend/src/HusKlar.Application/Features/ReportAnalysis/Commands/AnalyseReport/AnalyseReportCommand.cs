using HusKlar.Application.Common;
using HusKlar.Application.Features.ReportAnalysis.Dtos;
using MediatR;

namespace HusKlar.Application.Features.ReportAnalysis.Commands.AnalyseReport;

public record AnalyseReportCommand(Stream PdfStream, string ReportType)
    : IRequest<Result<ReportAnalysisResultDto>>;
