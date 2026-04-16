using System.Collections.Concurrent;
using System.Globalization;
using System.Text.Json;
using HusKlar.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace HusKlar.Infrastructure.Services.ExternalApis;

/// <summary>
/// Fetches municipality-level crime statistics from Danmarks Statistik (StatBank).
/// Coverage is annual and per-municipality — never per-address.
/// All failures return null so the rest of the surroundings result still renders.
/// </summary>
public class StatBankCrimeService : ICrimeStatisticsService
{
    private const string CrimeTable = "STRAF11";
    private const string PopulationTable = "FOLK1A";
    private const string BurglaryKeyword = "indbrud";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(24);
    private static readonly int[] YearFallbackOrder = [2024, 2023, 2022];

    private static readonly ConcurrentDictionary<string, (CrimeStatisticsResult Value, DateTime Expires)> Cache = new();

    private readonly HttpClient _httpClient;
    private readonly ILogger<StatBankCrimeService> _logger;

    public StatBankCrimeService(HttpClient httpClient, ILogger<StatBankCrimeService> logger)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://api.statbank.dk/v1/");
        _logger = logger;
    }

    public async Task<CrimeStatisticsResult?> GetForMunicipalityAsync(
        string municipalityCode, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(municipalityCode)) return null;

        var statbankCode = NormalizeMunicipalityCode(municipalityCode);

        if (Cache.TryGetValue(statbankCode, out var entry) && entry.Expires > DateTime.UtcNow)
            return entry.Value;

        try
        {
            foreach (var year in YearFallbackOrder)
            {
                var result = await TryFetchYear(statbankCode, year, cancellationToken);
                if (result is not null)
                {
                    Cache[statbankCode] = (result, DateTime.UtcNow.Add(CacheTtl));
                    return result;
                }
            }

            _logger.LogWarning("StatBank returned no data for kommune {Code} in any fallback year", statbankCode);
            return null;
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "StatBank HTTP error for kommune {Code}", statbankCode);
            return null;
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "StatBank parse error for kommune {Code}", statbankCode);
            return null;
        }
        catch (TaskCanceledException ex)
        {
            _logger.LogWarning(ex, "StatBank timeout for kommune {Code}", statbankCode);
            return null;
        }
    }

    private async Task<CrimeStatisticsResult?> TryFetchYear(
        string statbankCode, int year, CancellationToken ct)
    {
        var crimeRows = await FetchCrimeRows(statbankCode, year, ct);
        if (crimeRows.Count == 0) return null;

        var population = await FetchPopulation(statbankCode, year, ct);
        if (population is null or <= 0) return null;

        var totalCrimes = crimeRows.Sum(r => r.Count);
        var burglaries = crimeRows
            .Where(r => r.OffenseLabel.Contains(BurglaryKeyword, StringComparison.OrdinalIgnoreCase))
            .Sum(r => r.Count);

        var per1000 = (double)totalCrimes / population.Value * 1000.0;
        var burglariesPer1000 = (double)burglaries / population.Value * 1000.0;
        var municipalityName = crimeRows[0].MunicipalityName;

        return new CrimeStatisticsResult(
            MunicipalityName: municipalityName,
            Year: year,
            BurglariesPerThousand: Math.Round(burglariesPer1000, 1),
            TotalPerThousand: Math.Round(per1000, 1));
    }

    private async Task<List<CrimeRow>> FetchCrimeRows(
        string statbankCode, int year, CancellationToken ct)
    {
        // BulkData CSV endpoint with semicolon delimiter; valuePresentation=Default returns labels.
        var url = $"data/{CrimeTable}/CSV?lang=da&valuePresentation=Default&OMR%C3%85DE={statbankCode}&Tid={year}";
        var response = await _httpClient.GetAsync(url, ct);
        if (!response.IsSuccessStatusCode) return [];

        var csv = await response.Content.ReadAsStringAsync(ct);
        return ParseCrimeCsv(csv);
    }

    private async Task<int?> FetchPopulation(string statbankCode, int year, CancellationToken ct)
    {
        // FOLK1A is quarterly; request Q1 of the requested year. Aggregate sex/age/civilstatus by *.
        var quarter = $"{year}K1";
        var url = $"data/{PopulationTable}/CSV?lang=da&valuePresentation=Default&OMR%C3%85DE={statbankCode}&Tid={quarter}";
        var response = await _httpClient.GetAsync(url, ct);
        if (!response.IsSuccessStatusCode) return null;

        var csv = await response.Content.ReadAsStringAsync(ct);
        return ParsePopulationCsv(csv);
    }

    /// <summary>
    /// CSV columns from STRAF11 (default presentation):
    /// OMRÅDE;OVERTRÆDELSENS ART;TID;INDHOLD
    /// </summary>
    private static List<CrimeRow> ParseCrimeCsv(string csv)
    {
        var rows = new List<CrimeRow>();
        var lines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length < 2) return rows;

        for (var i = 1; i < lines.Length; i++)
        {
            var cols = lines[i].TrimEnd('\r').Split(';');
            if (cols.Length < 4) continue;
            if (!int.TryParse(cols[3].Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var count))
                continue;

            rows.Add(new CrimeRow(
                MunicipalityName: cols[0].Trim(),
                OffenseLabel: cols[1].Trim(),
                Count: count));
        }
        return rows;
    }

    /// <summary>
    /// FOLK1A CSV with default presentation — sums INDHOLD across all rows for the municipality.
    /// </summary>
    private static int? ParsePopulationCsv(string csv)
    {
        var lines = csv.Split('\n', StringSplitOptions.RemoveEmptyEntries);
        if (lines.Length < 2) return null;

        var total = 0;
        var header = lines[0].TrimEnd('\r').Split(';');
        var contentIdx = Array.FindIndex(header, h => h.Equals("INDHOLD", StringComparison.OrdinalIgnoreCase));
        if (contentIdx < 0) contentIdx = header.Length - 1;

        for (var i = 1; i < lines.Length; i++)
        {
            var cols = lines[i].TrimEnd('\r').Split(';');
            if (cols.Length <= contentIdx) continue;
            if (int.TryParse(cols[contentIdx].Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var n))
                total += n;
        }
        return total > 0 ? total : null;
    }

    /// <summary>
    /// DAWA returns 4-digit zero-padded kommunekoder ("0101"). StatBank's OMRÅDE
    /// accepts both forms but prefers the unpadded 3-digit form ("101").
    /// </summary>
    private static string NormalizeMunicipalityCode(string code) =>
        code.TrimStart('0') is var trimmed && trimmed.Length > 0 ? trimmed : code;

    private record CrimeRow(string MunicipalityName, string OffenseLabel, int Count);
}
