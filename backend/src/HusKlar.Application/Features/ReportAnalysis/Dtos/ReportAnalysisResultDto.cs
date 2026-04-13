namespace HusKlar.Application.Features.ReportAnalysis.Dtos;

public record ReportAnalysisResultDto(
    string Id,
    string Type,
    string OverallRisk,
    List<RiskItemDto> RiskItems,
    int TotalCostLow,
    int TotalCostHigh,
    string Summary,
    DateTime CreatedAt);

public record RiskItemDto(
    string Category,
    string Risk,
    string Finding,
    string PlainExplanation,
    int EstimatedCostLow,
    int EstimatedCostHigh);
