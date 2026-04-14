using HusKlar.Application.Features.Surroundings.Dtos;

namespace HusKlar.Infrastructure.Services.ExternalApis;

/// <summary>
/// Pure scoring logic for area quality — distance-based scoring (0-10).
/// Extracted from SurroundingsDataService to follow Single Responsibility.
/// </summary>
public static class AreaScoringService
{
    private const int TransportIdealMeters = 500;
    private const int TransportMaxMeters = 3000;
    private const int SchoolIdealMeters = 500;
    private const int SchoolMaxMeters = 3000;

    public static AreaScoresDto Calculate(
        IEnumerable<TransportStopDto> transport,
        IEnumerable<SchoolDto> schools)
    {
        var transportScore = DistanceScore(
            transport.Select(t => t.DistanceMeters),
            TransportIdealMeters, TransportMaxMeters);

        var schoolScore = DistanceScore(
            schools.Select(s => s.DistanceMeters),
            SchoolIdealMeters, SchoolMaxMeters);

        // TODO: Støjdata — Miljøstyrelsens støjkort (miljoegis.mim.dk/spatialmap?profile=noise)
        // bruger en SpatialSuite WMS med ukendt servicename. Mulige løsninger:
        // 1. Registrer gratis Dataforsyningen-token og brug deres støjzonedata
        // 2. Brug Overpass til at finde motorveje/hovedveje som proxy for støj
        // 3. Kontakt Miljøstyrelsen for WMS-adgang
        var noiseScore = 0;

        // Overall excludes noise until real data is available
        var overall = (int)Math.Round((transportScore + schoolScore) / 2.0);

        return new AreaScoresDto(transportScore, schoolScore, noiseScore, overall);
    }

    /// <summary>
    /// Scores 2-10 based on distance to closest POI.
    /// Closer than ideal = 10, farther than max = 2.
    /// </summary>
    private static int DistanceScore(
        IEnumerable<int> distances, int idealDistance, int maxDistance)
    {
        var closest = distances.DefaultIfEmpty(maxDistance).Min();
        if (closest <= idealDistance) return 10;
        if (closest >= maxDistance) return 2;
        var ratio = 1.0 - (double)(closest - idealDistance) / (maxDistance - idealDistance);
        return (int)Math.Round(2 + ratio * 8);
    }
}
