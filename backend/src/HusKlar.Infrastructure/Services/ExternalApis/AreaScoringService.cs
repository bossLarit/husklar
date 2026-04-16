using HusKlar.Application.Features.Surroundings.Dtos;
using HusKlar.Application.Interfaces;

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
    private const int ShoppingIdealMeters = 500;
    private const int ShoppingMaxMeters = 3000;
    private const int NatureIdealMeters = 800;
    private const int NatureMaxMeters = 3000;

    public static AreaScoresDto Calculate(
        IEnumerable<TransportStopDto> transport,
        IEnumerable<SchoolDto> schools,
        IEnumerable<ShopDto> shops,
        IEnumerable<NatureAreaDto> nature,
        CrimeStatisticsResult? crime,
        DataAvailabilityDto availability)
    {
        int? transportScore = availability.TransportAvailable
            ? DistanceScore(transport.Select(t => t.DistanceMeters), TransportIdealMeters, TransportMaxMeters)
            : null;

        int? schoolScore = availability.SchoolsAvailable
            ? DistanceScore(schools.Select(s => s.DistanceMeters), SchoolIdealMeters, SchoolMaxMeters)
            : null;

        int? shoppingScore = availability.ShoppingAvailable
            ? DistanceScore(shops.Select(s => s.DistanceMeters), ShoppingIdealMeters, ShoppingMaxMeters)
            : null;

        int? natureScore = availability.NatureAvailable
            ? DistanceScore(nature.Select(n => n.DistanceMeters), NatureIdealMeters, NatureMaxMeters)
            : null;

        int? crimeScore = availability.CrimeAvailable && crime is not null
            ? CrimeScore(crime.BurglariesPerThousand)
            : null;

        // TODO: Støjdata — Miljøstyrelsens støjkort (currently always unavailable)
        int? noiseScore = null;

        var availableScores = new[] { transportScore, schoolScore, shoppingScore, natureScore, crimeScore, noiseScore }
            .Where(s => s.HasValue)
            .Select(s => s!.Value)
            .ToList();

        int? overall = availableScores.Count > 0
            ? (int)Math.Round(availableScores.Average())
            : null;

        return new AreaScoresDto(transportScore, schoolScore, shoppingScore, natureScore, crimeScore, noiseScore, overall);
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

    /// <summary>
    /// Scores 2-10 based on burglaries per 1000 inhabitants in the municipality.
    /// Lower crime = higher score. Calibrated against typical Danish municipality range (~2-12/1000).
    /// TODO: Calibrate thresholds against real DST data for fx København, Lemvig, Gentofte before production.
    /// </summary>
    private static int CrimeScore(double burglariesPerThousand)
    {
        if (burglariesPerThousand <= 3) return 10;
        if (burglariesPerThousand >= 10) return 2;
        var ratio = 1.0 - (burglariesPerThousand - 3) / 7.0;
        return (int)Math.Round(2 + ratio * 8);
    }
}
