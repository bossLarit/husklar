namespace HusKlar.Application.Features.Surroundings.Dtos;

public record SurroundingsResultDto(
    string Address,
    CoordinatesDto Coordinates,
    List<SchoolDto> Schools,
    List<TransportStopDto> Transport,
    List<ShopDto> Shops,
    List<NatureAreaDto> NatureAreas,
    NoiseLevelDto NoiseLevel,
    CrimeDataDto? Crime,
    AreaScoresDto Scores,
    DataAvailabilityDto Availability);

public record CoordinatesDto(double Lat, double Lng);

public record SchoolDto(string Name, string Type, int DistanceMeters);

public record TransportStopDto(string Name, string Type, int DistanceMeters, List<string> Lines);

public record ShopDto(string Name, string Type, int DistanceMeters);

public record NatureAreaDto(string Name, string Type, int DistanceMeters);

public record NoiseLevelDto(int? RoadDb, int? RailDb, string Category);

/// <summary>
/// Crime statistics for the municipality the address belongs to.
/// Coverage is municipality-wide and annual, not per-address.
/// Scope is always "kommuneplan" so the UI can label it correctly.
/// </summary>
public record CrimeDataDto(
    string MunicipalityName,
    int Year,
    double BurglariesPerThousand,
    double TotalPerThousand,
    string Scope = "kommuneplan");

/// <summary>
/// Scores are null when data is unavailable (e.g. external API failed).
/// A null score must never be shown as a number — always as "Ingen data" or similar.
/// </summary>
public record AreaScoresDto(
    int? Transport,
    int? Schools,
    int? Shopping,
    int? Nature,
    int? Crime,
    int? Noise,
    int? Overall);

/// <summary>
/// Tracks which categories have real data. False means the external API failed.
/// Empty lists with Available=true is a valid answer ("nothing in range").
/// </summary>
public record DataAvailabilityDto(
    bool SchoolsAvailable,
    bool TransportAvailable,
    bool ShoppingAvailable,
    bool NatureAvailable,
    bool CrimeAvailable);
