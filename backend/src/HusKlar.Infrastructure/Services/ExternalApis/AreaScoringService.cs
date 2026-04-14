using HusKlar.Application.Features.Surroundings.Dtos;

namespace HusKlar.Infrastructure.Services.ExternalApis;

/// <summary>
/// Pure scoring logic for area quality — distance-based scoring (0-10).
/// Returns null scores when data is unavailable (never a fake "2/10" fallback).
/// </summary>
public static class AreaScoringService
{
    private const int TransportIdealMeters = 500;
    private const int TransportMaxMeters = 3000;
    private const int SchoolIdealMeters = 500;
    private const int SchoolMaxMeters = 3000;

    public static AreaScoresDto Calculate(
        IEnumerable<TransportStopDto> transport,
        IEnumerable<SchoolDto> schools,
        DataAvailabilityDto availability)
    {
        // Only score categories where real data was loaded successfully.
        // Unavailable data = null, never a fallback number.
        int? transportScore = availability.TransportAvailable
            ? DistanceScore(transport.Select(t => t.DistanceMeters), TransportIdealMeters, TransportMaxMeters)
            : null;

        int? schoolScore = availability.SchoolsAvailable
            ? DistanceScore(schools.Select(s => s.DistanceMeters), SchoolIdealMeters, SchoolMaxMeters)
            : null;

        // TODO: Støjdata — Miljøstyrelsens støjkort
        // Currently always unavailable (no data source integrated).
        int? noiseScore = null;

        // Overall is average of available categories only. Null if nothing is available.
        var availableScores = new[] { transportScore, schoolScore, noiseScore }
            .Where(s => s.HasValue)
            .Select(s => s!.Value)
            .ToList();

        int? overall = availableScores.Count > 0
            ? (int)Math.Round(availableScores.Average())
            : null;

        return new AreaScoresDto(transportScore, schoolScore, noiseScore, overall);
    }

    /// <summary>
    /// Scores 2-10 based on distance to closest POI. Only call when data is available.
    /// Closer than ideal = 10, farther than max = 2.
    /// An empty list means "nothing in range" — legitimately a low score, not missing data.
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
