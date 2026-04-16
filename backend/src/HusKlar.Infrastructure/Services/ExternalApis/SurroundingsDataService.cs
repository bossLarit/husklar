using System.Globalization;
using HusKlar.Application.Common;
using HusKlar.Application.Features.Surroundings.Dtos;
using HusKlar.Application.Interfaces;

namespace HusKlar.Infrastructure.Services.ExternalApis;

public class SurroundingsDataService : ISurroundingsDataService
{
    private readonly OverpassClient _overpass;
    private readonly ICrimeStatisticsService _crime;

    public SurroundingsDataService(OverpassClient overpass, ICrimeStatisticsService crime)
    {
        _overpass = overpass;
        _crime = crime;
    }

    public async Task<SurroundingsResultDto> GetSurroundingsAsync(
        double latitude, double longitude, string address, string? municipalityCode,
        CancellationToken cancellationToken = default)
    {
        var schoolsTask = FetchSchools(latitude, longitude, 5000, cancellationToken);
        var transportTask = FetchTransport(latitude, longitude, 5000, cancellationToken);
        var shoppingTask = FetchShopping(latitude, longitude, 5000, cancellationToken);
        var natureTask = FetchNature(latitude, longitude, 5000, cancellationToken);
        var crimeTask = string.IsNullOrWhiteSpace(municipalityCode)
            ? Task.FromResult<CrimeStatisticsResult?>(null)
            : _crime.GetForMunicipalityAsync(municipalityCode, cancellationToken);

        await Task.WhenAll(schoolsTask, transportTask, shoppingTask, natureTask, crimeTask);

        var (schools, schoolsAvailable) = schoolsTask.Result;
        var (transport, transportAvailable) = transportTask.Result;
        var (shops, shoppingAvailable) = shoppingTask.Result;
        var (nature, natureAvailable) = natureTask.Result;
        var crime = crimeTask.Result;

        // Fail loud only when ALL OSM categories failed — crime is naturally optional (separate API).
        if (!schoolsAvailable && !transportAvailable && !shoppingAvailable && !natureAvailable)
        {
            throw new ExternalServiceUnavailableException("OpenStreetMap/Overpass");
        }

        var availability = new DataAvailabilityDto(
            SchoolsAvailable: schoolsAvailable,
            TransportAvailable: transportAvailable,
            ShoppingAvailable: shoppingAvailable,
            NatureAvailable: natureAvailable,
            CrimeAvailable: crime is not null);

        var orderedSchools = schools.OrderBy(s => s.DistanceMeters).Take(8).ToList();
        var orderedTransport = transport.OrderBy(t => t.DistanceMeters).Take(8).ToList();
        var orderedShops = shops.OrderBy(s => s.DistanceMeters).Take(8).ToList();
        var orderedNature = DedupeNature(nature, 150).OrderBy(n => n.DistanceMeters).Take(8).ToList();

        var scores = AreaScoringService.Calculate(
            orderedTransport, orderedSchools, orderedShops, orderedNature, crime, availability);

        var crimeDto = crime is null
            ? null
            : new CrimeDataDto(
                MunicipalityName: crime.MunicipalityName,
                Year: crime.Year,
                BurglariesPerThousand: crime.BurglariesPerThousand,
                TotalPerThousand: crime.TotalPerThousand);

        return new SurroundingsResultDto(
            Address: address,
            Coordinates: new CoordinatesDto(latitude, longitude),
            Schools: orderedSchools,
            Transport: orderedTransport,
            Shops: orderedShops,
            NatureAreas: orderedNature,
            NoiseLevel: new NoiseLevelDto(null, null, "ukendt"),
            Crime: crimeDto,
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

    private async Task<(List<ShopDto> items, bool available)> FetchShopping(
        double lat, double lng, int radius, CancellationToken ct)
    {
        var query = BuildQuery($$"""
            node["shop"~"supermarket|convenience|grocery|greengrocer|bakery|butcher"](around:{{radius}},{{FormatCoord(lat)}},{{FormatCoord(lng)}});
            way["shop"~"supermarket|convenience|grocery|greengrocer|bakery|butcher"](around:{{radius}},{{FormatCoord(lat)}},{{FormatCoord(lng)}});
            node["shop"="mall"](around:{{radius}},{{FormatCoord(lat)}},{{FormatCoord(lng)}});
            way["shop"="mall"](around:{{radius}},{{FormatCoord(lat)}},{{FormatCoord(lng)}});
            """);

        var result = await _overpass.QueryAsync(query, ct);

        if (!result.Success)
        {
            return ([], available: false);
        }

        var shops = result.Elements
            .Where(e => e.Tags is not null && !string.IsNullOrEmpty(e.Tags.GetValueOrDefault("name")))
            .Select(e => new ShopDto(
                Name: e.Tags!.GetValueOrDefault("name", "Butik"),
                Type: MapShopType(e.Tags!.GetValueOrDefault("shop", "shop")),
                DistanceMeters: (int)Haversine.Distance(lat, lng, e.Lat ?? e.Center?.Lat ?? 0, e.Lon ?? e.Center?.Lon ?? 0)))
            .ToList();

        return (shops, available: true);
    }

    private async Task<(List<NatureAreaDto> items, bool available)> FetchNature(
        double lat, double lng, int radius, CancellationToken ct)
    {
        var query = BuildQuery($$"""
            node["leisure"~"park|nature_reserve|garden"](around:{{radius}},{{FormatCoord(lat)}},{{FormatCoord(lng)}});
            way["leisure"~"park|nature_reserve|garden"](around:{{radius}},{{FormatCoord(lat)}},{{FormatCoord(lng)}});
            relation["leisure"~"park|nature_reserve"](around:{{radius}},{{FormatCoord(lat)}},{{FormatCoord(lng)}});
            way["landuse"="forest"](around:{{radius}},{{FormatCoord(lat)}},{{FormatCoord(lng)}});
            way["natural"~"wood|heath|grassland"](around:{{radius}},{{FormatCoord(lat)}},{{FormatCoord(lng)}});
            relation["natural"~"wood|heath"](around:{{radius}},{{FormatCoord(lat)}},{{FormatCoord(lng)}});
            """);

        var result = await _overpass.QueryAsync(query, ct);

        if (!result.Success)
        {
            return ([], available: false);
        }

        var areas = result.Elements
            .Select(e => new NatureAreaDto(
                Name: e.Tags?.GetValueOrDefault("name") ?? "Grønt område",
                Type: MapNatureType(e.Tags),
                DistanceMeters: (int)Haversine.Distance(lat, lng, e.Lat ?? e.Center?.Lat ?? 0, e.Lon ?? e.Center?.Lon ?? 0)))
            .ToList();

        return (areas, available: true);
    }

    // Bumped from 15 -> 25 to accommodate 4 parallel queries (schools, transport, shopping, nature).
    private static string BuildQuery(string body) =>
        $"""
        [out:json][timeout:25];
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

    private static string MapShopType(string shop) => shop switch
    {
        "supermarket" => "supermarked",
        "convenience" => "nærbutik",
        "grocery" => "købmand",
        "greengrocer" => "grønthandler",
        "bakery" => "bager",
        "butcher" => "slagter",
        "mall" => "butikscenter",
        _ => "butik",
    };

    private static string MapNatureType(Dictionary<string, string>? tags)
    {
        if (tags is null) return "grønt område";
        var leisure = tags.GetValueOrDefault("leisure");
        if (leisure == "park") return "park";
        if (leisure == "nature_reserve") return "naturreservat";
        if (leisure == "garden") return "have";
        var landuse = tags.GetValueOrDefault("landuse");
        if (landuse == "forest") return "skov";
        var natural = tags.GetValueOrDefault("natural");
        if (natural == "wood") return "skov";
        if (natural == "heath") return "hede";
        if (natural == "grassland") return "eng";
        return "grønt område";
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

    /// <summary>
    /// Collapses nature areas that share name+type within a distance threshold.
    /// Same forest often appears as both way and relation in OSM.
    /// </summary>
    private static List<NatureAreaDto> DedupeNature(
        List<NatureAreaDto> areas, int thresholdMeters)
    {
        var result = new List<NatureAreaDto>();
        var used = new HashSet<int>();

        for (var i = 0; i < areas.Count; i++)
        {
            if (used.Contains(i)) continue;
            used.Add(i);

            var best = areas[i];
            for (var j = i + 1; j < areas.Count; j++)
            {
                if (used.Contains(j)) continue;
                if (areas[j].Name != best.Name || areas[j].Type != best.Type) continue;
                if (Math.Abs(best.DistanceMeters - areas[j].DistanceMeters) > thresholdMeters) continue;
                used.Add(j);
                if (areas[j].DistanceMeters < best.DistanceMeters) best = areas[j];
            }
            result.Add(best);
        }

        return result;
    }
}
