using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using HusKlar.Application.Features.Surroundings.Dtos;
using HusKlar.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace HusKlar.Infrastructure.Services.ExternalApis;

public class SurroundingsDataService : ISurroundingsDataService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<SurroundingsDataService> _logger;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    // Multiple Overpass mirrors — primary server is often overloaded
    private static readonly string[] OverpassEndpoints =
    [
        "https://overpass.kumi.systems/api/interpreter",
        "https://overpass-api.de/api/interpreter",
    ];

    public SurroundingsDataService(HttpClient httpClient, ILogger<SurroundingsDataService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<SurroundingsResultDto> GetSurroundingsAsync(
        double latitude, double longitude, string address,
        CancellationToken cancellationToken = default)
    {
        var schoolsTask = FetchSchools(latitude, longitude, 5000, cancellationToken);
        var transportTask = FetchTransport(latitude, longitude, 5000, cancellationToken);

        await Task.WhenAll(schoolsTask, transportTask);

        var allSchools = schoolsTask.Result.OrderBy(s => s.DistanceMeters).Take(8).ToList();
        var transport = transportTask.Result.OrderBy(t => t.DistanceMeters).Take(8).ToList();

        var transportScore = CalculateScore(transport.Select(t => t.DistanceMeters), 500, 3000);
        var schoolScore = CalculateScore(allSchools.Select(s => s.DistanceMeters), 500, 3000);
        // TODO: Støjdata — Miljøstyrelsens støjkort (miljoegis.mim.dk/spatialmap?profile=noise)
        // bruger en SpatialSuite WMS med ukendt servicename. Mulige løsninger:
        // 1. Registrer gratis Dataforsyningen-token og brug deres støjzonedata
        // 2. Brug Overpass til at finde motorveje/hovedveje som proxy for støj
        // 3. Kontakt Miljøstyrelsen for WMS-adgang
        var noiseScore = 0;
        var overall = (int)Math.Round((transportScore + schoolScore) / 2.0);

        return new SurroundingsResultDto(
            Address: address,
            Coordinates: new CoordinatesDto(latitude, longitude),
            Schools: allSchools,
            Transport: transport,
            NoiseLevel: new NoiseLevelDto(null, null, "ukendt"),
            Scores: new AreaScoresDto(transportScore, schoolScore, noiseScore, overall)
        );
    }

    private async Task<List<SchoolDto>> FetchSchools(double lat, double lng, int radius, CancellationToken ct)
    {
        var latStr = lat.ToString(CultureInfo.InvariantCulture);
        var lngStr = lng.ToString(CultureInfo.InvariantCulture);
        var query = $"""
            [out:json][timeout:15];
            (
              node["amenity"~"school|kindergarten|college"](around:{radius},{latStr},{lngStr});
              way["amenity"~"school|kindergarten|college"](around:{radius},{latStr},{lngStr});
            );
            out center tags;
            """;

        var pois = await RunOverpassQuery(query, lat, lng, requireName: true, ct);

        return pois.Select(p =>
        {
            var amenity = p.Tags.GetValueOrDefault("amenity", "school");
            var type = amenity switch
            {
                "kindergarten" => "børnehave",
                "college" => "gymnasium/college",
                _ => "folkeskole",
            };
            return new SchoolDto(p.Name, type, p.DistanceMeters);
        }).ToList();
    }

    private async Task<List<TransportStopDto>> FetchTransport(double lat, double lng, int radius, CancellationToken ct)
    {
        var latStr = lat.ToString(CultureInfo.InvariantCulture);
        var lngStr = lng.ToString(CultureInfo.InvariantCulture);
        var query = $"""
            [out:json][timeout:15];
            (
              node["highway"="bus_stop"](around:{radius},{latStr},{lngStr});
              node["public_transport"~"stop_position|platform|station"](around:{radius},{latStr},{lngStr});
              node["railway"~"station|halt"](around:{radius},{latStr},{lngStr});
              way["railway"="station"](around:{radius},{latStr},{lngStr});
            );
            out center tags;
            """;

        // Don't require name — many Danish bus stops have no name in OSM
        var pois = await RunOverpassQuery(query, lat, lng, requireName: false, ct);

        // Deduplicate nearby unnamed stops
        var grouped = GroupNearbyStops(pois, 80);

        return grouped.Select(p =>
        {
            var type = "busstop";
            if (p.Tags.ContainsKey("railway")) type = "togstation";
            else if (p.Tags.GetValueOrDefault("public_transport") == "station") type = "station";

            return new TransportStopDto(p.Name, type, p.DistanceMeters, []);
        }).ToList();
    }

    private async Task<List<OverpassPoi>> RunOverpassQuery(
        string query, double originLat, double originLng,
        bool requireName, CancellationToken ct)
    {
        foreach (var endpoint in OverpassEndpoints)
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

                // Overpass returns HTML on overload — detect and skip
                if (responseText.TrimStart().StartsWith('<'))
                {
                    _logger.LogWarning("Overpass {Endpoint} returned HTML error, trying next", endpoint);
                    continue;
                }

                var result = JsonSerializer.Deserialize<OverpassResponse>(responseText, JsonOptions);

                return (result?.Elements ?? [])
                    .Where(e => !requireName || !string.IsNullOrEmpty(e.Tags?.GetValueOrDefault("name")))
                    .Select(e =>
                    {
                        var eLat = e.Lat ?? e.Center?.Lat ?? 0;
                        var eLng = e.Lon ?? e.Center?.Lon ?? 0;
                        var distance = HaversineDistance(originLat, originLng, eLat, eLng);
                        var name = e.Tags?.GetValueOrDefault("name")
                            ?? e.Tags?.GetValueOrDefault("description")
                            ?? "Busstoppested";
                        return new OverpassPoi(name, (int)distance, e.Tags ?? []);
                    })
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Overpass {Endpoint} failed", endpoint);
            }
        }

        _logger.LogError("All Overpass endpoints failed for query");
        return [];
    }

    private static List<OverpassPoi> GroupNearbyStops(List<OverpassPoi> stops, int thresholdMeters)
    {
        var result = new List<OverpassPoi>();
        var used = new HashSet<int>();

        for (var i = 0; i < stops.Count; i++)
        {
            if (used.Contains(i)) continue;
            used.Add(i);

            var best = stops[i];
            for (var j = i + 1; j < stops.Count; j++)
            {
                if (used.Contains(j)) continue;
                if (Math.Abs(best.DistanceMeters - stops[j].DistanceMeters) > thresholdMeters) continue;
                used.Add(j);
                // Prefer the one with a real name
                if (best.Name == "Busstoppested" && stops[j].Name != "Busstoppested")
                    best = stops[j];
            }

            result.Add(best);
        }

        return result;
    }

    private static int CalculateScore(IEnumerable<int> distances, int idealDistance, int maxDistance)
    {
        var closest = distances.DefaultIfEmpty(maxDistance).Min();
        if (closest <= idealDistance) return 10;
        if (closest >= maxDistance) return 2;
        var ratio = 1.0 - (double)(closest - idealDistance) / (maxDistance - idealDistance);
        return (int)Math.Round(2 + ratio * 8);
    }

    private static double HaversineDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371000;
        var dLat = ToRad(lat2 - lat1);
        var dLon = ToRad(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static double ToRad(double deg) => deg * Math.PI / 180;

    private record OverpassResponse(List<OverpassElement> Elements);
    private record OverpassElement(double? Lat, double? Lon, OverpassCenter? Center, Dictionary<string, string>? Tags);
    private record OverpassCenter(double Lat, double Lon);
    private record OverpassPoi(string Name, int DistanceMeters, Dictionary<string, string> Tags);
}
