using System.Globalization;
using HusKlar.Application.Common;
using HusKlar.Application.Features.Surroundings.Dtos;
using HusKlar.Application.Interfaces;

namespace HusKlar.Infrastructure.Services.ExternalApis;

public class SurroundingsDataService : ISurroundingsDataService
{
    private readonly OverpassClient _overpass;

    public SurroundingsDataService(OverpassClient overpass)
    {
        _overpass = overpass;
    }

    public async Task<SurroundingsResultDto> GetSurroundingsAsync(
        double latitude, double longitude, string address,
        CancellationToken cancellationToken = default)
    {
        var schoolsTask = FetchSchools(latitude, longitude, 5000, cancellationToken);
        var transportTask = FetchTransport(latitude, longitude, 5000, cancellationToken);

        await Task.WhenAll(schoolsTask, transportTask);

        var (schools, schoolsAvailable) = schoolsTask.Result;
        var (transport, transportAvailable) = transportTask.Result;

        // Fail loud if BOTH categories are unavailable — no meaningful data to return
        if (!schoolsAvailable && !transportAvailable)
        {
            throw new ExternalServiceUnavailableException("OpenStreetMap/Overpass");
        }

        var availability = new DataAvailabilityDto(schoolsAvailable, transportAvailable);

        var orderedSchools = schools.OrderBy(s => s.DistanceMeters).Take(8).ToList();
        var orderedTransport = transport.OrderBy(t => t.DistanceMeters).Take(8).ToList();

        var scores = AreaScoringService.Calculate(orderedTransport, orderedSchools, availability);

        return new SurroundingsResultDto(
            Address: address,
            Coordinates: new CoordinatesDto(latitude, longitude),
            Schools: orderedSchools,
            Transport: orderedTransport,
            NoiseLevel: new NoiseLevelDto(null, null, "ukendt"),
            Scores: scores,
            Availability: availability
        );
    }

    private async Task<(List<SchoolDto> items, bool available)> FetchSchools(
        double lat, double lng, int radius, CancellationToken ct)
    {
        var query = BuildQuery($$"""
            node["amenity"~"school|kindergarten|college"](around:{{radius}},{{FormatCoord(lat)}},{{FormatCoord(lng)}});
            way["amenity"~"school|kindergarten|college"](around:{{radius}},{{FormatCoord(lat)}},{{FormatCoord(lng)}});
            """);

        var result = await _overpass.QueryAsync(query, ct);

        if (!result.Success)
        {
            return ([], available: false);
        }

        var schools = result.Elements
            .Where(e => e.Tags is not null && !string.IsNullOrEmpty(e.Tags.GetValueOrDefault("name")))
            .Select(e => new SchoolDto(
                Name: e.Tags!.GetValueOrDefault("name", "Ukendt"),
                Type: MapSchoolType(e.Tags!.GetValueOrDefault("amenity", "school")),
                DistanceMeters: (int)Haversine.Distance(lat, lng, e.Lat ?? e.Center?.Lat ?? 0, e.Lon ?? e.Center?.Lon ?? 0)))
            .ToList();

        return (schools, available: true);
    }

    private async Task<(List<TransportStopDto> items, bool available)> FetchTransport(
        double lat, double lng, int radius, CancellationToken ct)
    {
        var query = BuildQuery($$"""
            node["highway"="bus_stop"](around:{{radius}},{{FormatCoord(lat)}},{{FormatCoord(lng)}});
            node["public_transport"~"stop_position|platform|station"](around:{{radius}},{{FormatCoord(lat)}},{{FormatCoord(lng)}});
            node["railway"~"station|halt"](around:{{radius}},{{FormatCoord(lat)}},{{FormatCoord(lng)}});
            way["railway"="station"](around:{{radius}},{{FormatCoord(lat)}},{{FormatCoord(lng)}});
            """);

        var result = await _overpass.QueryAsync(query, ct);

        if (!result.Success)
        {
            return ([], available: false);
        }

        var stops = result.Elements
            .Select(e => new TransportStopDto(
                Name: e.Tags?.GetValueOrDefault("name") ?? "Busstoppested",
                Type: MapTransportType(e.Tags),
                DistanceMeters: (int)Haversine.Distance(lat, lng, e.Lat ?? e.Center?.Lat ?? 0, e.Lon ?? e.Center?.Lon ?? 0),
                Lines: []))
            .ToList();

        return (GroupNearby(stops, 80), available: true);
    }

    private static string BuildQuery(string body) =>
        $"""
        [out:json][timeout:15];
        (
        {body}
        );
        out center tags;
        """;

    private static string FormatCoord(double value) =>
        value.ToString(CultureInfo.InvariantCulture);

    private static string MapSchoolType(string amenity) => amenity switch
    {
        "kindergarten" => "børnehave",
        "college" => "gymnasium/college",
        _ => "folkeskole",
    };

    private static string MapTransportType(Dictionary<string, string>? tags)
    {
        if (tags is null) return "busstop";
        if (tags.ContainsKey("railway")) return "togstation";
        if (tags.GetValueOrDefault("public_transport") == "station") return "station";
        return "busstop";
    }

    /// <summary>
    /// Deduplicates stops within a distance threshold, preferring named stops.
    /// </summary>
    private static List<TransportStopDto> GroupNearby(
        List<TransportStopDto> stops, int thresholdMeters)
    {
        var result = new List<TransportStopDto>();
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
                if (best.Name == "Busstoppested" && stops[j].Name != "Busstoppested")
                    best = stops[j];
            }
            result.Add(best);
        }

        return result;
    }
}
