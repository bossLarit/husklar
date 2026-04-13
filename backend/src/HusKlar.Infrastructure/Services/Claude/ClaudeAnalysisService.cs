using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using HusKlar.Application.Features.ReportAnalysis.Dtos;
using HusKlar.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace HusKlar.Infrastructure.Services.Claude;

public class ClaudeAnalysisService : IClaudeAnalysisService
{
    private readonly HttpClient _httpClient;
    private readonly string? _apiKey;
    private readonly ILogger<ClaudeAnalysisService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    public ClaudeAnalysisService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<ClaudeAnalysisService> logger)
    {
        _httpClient = httpClient;
        _apiKey = configuration["CLAUDE_API_KEY"];
        _logger = logger;
    }

    public async Task<ReportAnalysisResultDto> AnalyseAsync(
        string extractedText,
        string reportType,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogWarning("CLAUDE_API_KEY not configured, returning mock analysis");
            return BuildMockAnalysis(reportType);
        }

        var requestBody = new
        {
            model = "claude-haiku-4-5-20251001",
            max_tokens = 4096,
            system = ClaudePrompts.SystemPrompt,
            messages = new[]
            {
                new
                {
                    role = "user",
                    content = ClaudePrompts.BuildUserPrompt(reportType, extractedText)
                }
            }
        };

        var json = JsonSerializer.Serialize(requestBody, JsonOptions);
        // Retry up to 3 times on overloaded (529) or rate-limited (429) responses
        HttpResponseMessage response = null!;
        for (var attempt = 0; attempt < 3; attempt++)
        {
            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages")
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            request.Headers.Add("x-api-key", _apiKey);
            request.Headers.Add("anthropic-version", "2023-06-01");

            response = await _httpClient.SendAsync(request, cancellationToken);

            if ((int)response.StatusCode is not (529 or 429))
                break;

            _logger.LogWarning("Claude API returned {Status}, retrying in {Seconds}s (attempt {Attempt}/3)",
                (int)response.StatusCode, attempt + 1, attempt + 1);
            await Task.Delay(TimeSpan.FromSeconds(attempt + 1), cancellationToken);
        }

        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
        var claudeResponse = JsonSerializer.Deserialize<ClaudeMessageResponse>(responseJson, JsonOptions);

        var textContent = claudeResponse?.Content?.FirstOrDefault(c => c.Type == "text")?.Text
            ?? throw new InvalidOperationException("No text content in Claude response");

        // Strip markdown code fences if Claude wraps the JSON
        var jsonText = textContent.Trim();
        if (jsonText.StartsWith("```"))
        {
            var firstNewline = jsonText.IndexOf('\n');
            if (firstNewline >= 0)
                jsonText = jsonText[(firstNewline + 1)..];
            if (jsonText.EndsWith("```"))
                jsonText = jsonText[..^3];
            jsonText = jsonText.Trim();
        }

        var analysis = JsonSerializer.Deserialize<ClaudeAnalysisResponse>(jsonText, JsonOptions)
            ?? throw new InvalidOperationException("Failed to parse Claude analysis JSON");

        return new ReportAnalysisResultDto(
            Id: Guid.NewGuid().ToString(),
            Type: reportType,
            OverallRisk: analysis.OverallRisk,
            RiskItems: analysis.RiskItems.Select(r => new RiskItemDto(
                r.Category, r.Risk, r.Finding, r.PlainExplanation,
                r.EstimatedCostLow, r.EstimatedCostHigh
            )).ToList(),
            TotalCostLow: analysis.TotalCostLow,
            TotalCostHigh: analysis.TotalCostHigh,
            Summary: analysis.Summary,
            CreatedAt: DateTime.UtcNow
        );
    }

    private static ReportAnalysisResultDto BuildMockAnalysis(string reportType) =>
        new(
            Id: Guid.NewGuid().ToString(),
            Type: reportType,
            OverallRisk: "yellow",
            RiskItems: new List<RiskItemDto>
            {
                new("Tag", "yellow", "Tagbelægningen viser tegn på slid (K2-note).",
                    "Taget skal sandsynligvis udskiftes inden for 5-10 år. Det er ikke akut, men du bør budgettere med det.",
                    80_000, 150_000),
                new("Fundament", "green", "Ingen synlige revner eller sætninger.",
                    "Fundamentet ser fint ud. Ingen grund til bekymring.",
                    0, 0),
                new("El-installation", "red", "GIVE-klassificering på hovedtavle.",
                    "El-tavlen er forældet og kan udgøre en brandrisiko. Bør udskiftes før indflytning.",
                    15_000, 30_000),
            },
            TotalCostLow: 95_000,
            TotalCostHigh: 180_000,
            Summary: "Boligen har moderate problemer. Taget er slidt og el-tavlen bør udskiftes. Samlet set et acceptabelt køb, hvis du budgetterer med renoveringerne.",
            CreatedAt: DateTime.UtcNow
        );

    // Claude API response types
    private record ClaudeMessageResponse(List<ContentBlock> Content);
    private record ContentBlock(string Type, string Text);
    private record ClaudeAnalysisResponse(
        string OverallRisk,
        string Summary,
        int TotalCostLow,
        int TotalCostHigh,
        List<ClaudeRiskItem> RiskItems);
    private record ClaudeRiskItem(
        string Category,
        string Risk,
        string Finding,
        string PlainExplanation,
        int EstimatedCostLow,
        int EstimatedCostHigh);
}
