namespace HusKlar.Application.Interfaces;

public interface ICrimeStatisticsService
{
    Task<CrimeStatisticsResult?> GetForMunicipalityAsync(
        string municipalityCode, CancellationToken cancellationToken = default);
}

public record CrimeStatisticsResult(
    string MunicipalityName,
    int Year,
    double BurglariesPerThousand,
    double TotalPerThousand);
