using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace HusKlar.Infrastructure.Services.ExternalApis;

/// <summary>
/// Client for the Overpass API (OpenStreetMap query endpoint).
/// Handles failover between mirrors and response parsing.
/// </summary>
public class OverpassClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<OverpassClient> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    private static readonly string[] Endpoints =
    [
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass-api.de/api/interpreter",
    ];

    public OverpassClient(HttpClient httpClient, ILogger<OverpassClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    /// <summary>
    /// Executes an Overpass query. Returns Success=false if all mirrors failed,
    /// so callers can distinguish "no data available" from "data loaded, nothing found".
    /// </summary>
    public async Task<OverpassQueryResult> QueryAsync(string query, CancellationToken ct)
    {
        foreach (var endpoint in Endpoints)
        {
            try
            {
                var content = new FormUrlEncodedContent([new("data", query)]);
                var response = await _httpClient.PostAsync(endpoint, content, ct);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Overpass {Endpoint} returned {Status}", endpoint, response.StatusCode);
                    continue;
                }

                var responseText = await response.Content.ReadAsStringAsync(ct);

                // Overpass returns HTML on overload — detect and try next mirror
                if (responseText.TrimStart().StartsWith('<'))
                {
                    _logger.LogWarning("Overpass {Endpoint} returned HTML error, trying next", endpoint);
                    continue;
                }

                var result = JsonSerializer.Deserialize<OverpassResponse>(responseText, JsonOptions);
                return new OverpassQueryResult(result?.Elements ?? [], Success: true);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Overpass {Endpoint} failed", endpoint);
            }
        }

        _logger.LogError("All Overpass endpoints failed for query");
        return new OverpassQueryResult([], Success: false);
    }

    public record OverpassQueryResult(List<OverpassElement> Elements, bool Success);
    public record OverpassResponse(List<OverpassElement> Elements);
    public record OverpassElement(
        double? Lat, double? Lon, OverpassCenter? Center,
        Dictionary<string, string>? Tags);
    public record OverpassCenter(double Lat, double Lon);
}
