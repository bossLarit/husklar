using HusKlar.Domain.Enums;

namespace HusKlar.Domain.Entities;

public class ReportAnalysis
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required Guid UserId { get; init; }
    public required ReportType Type { get; init; }
    public required RiskLevel OverallRisk { get; init; }
    public required string Summary { get; init; }
    public required int TotalCostLow { get; init; }
    public required int TotalCostHigh { get; init; }
    public required List<RiskItem> RiskItems { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

public class RiskItem
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string Category { get; init; }
    public required RiskLevel Risk { get; init; }
    public required string Finding { get; init; }
    public required string PlainExplanation { get; init; }
    public required int EstimatedCostLow { get; init; }
    public required int EstimatedCostHigh { get; init; }
}
