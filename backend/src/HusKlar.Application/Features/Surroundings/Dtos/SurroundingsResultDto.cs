namespace HusKlar.Application.Features.Surroundings.Dtos;

public record SurroundingsResultDto(
    string Address,
    CoordinatesDto Coordinates,
    List<SchoolDto> Schools,
    List<TransportStopDto> Transport,
    NoiseLevelDto NoiseLevel,
    AreaScoresDto Scores,
    DataAvailabilityDto Availability);

public record CoordinatesDto(double Lat, double Lng);

public record SchoolDto(string Name, string Type, int DistanceMeters);

public record TransportStopDto(string Name, string Type, int DistanceMeters, List<string> Lines);

public record NoiseLevelDto(int? RoadDb, int? RailDb, string Category);

/// <summary>
/// Scores are null when data is unavailable (e.g. external API failed).
/// A null score must never be shown as a number — always as "Ingen data" or similar.
/// </summary>
public record AreaScoresDto(int? Transport, int? Schools, int? Noise, int? Overall);

/// <summary>
/// Tracks which categories have real data. False means the external API failed.
/// Empty lists with Available=true is a valid answer ("nothing in range").
/// </summary>
public record DataAvailabilityDto(bool SchoolsAvailable, bool TransportAvailable);
