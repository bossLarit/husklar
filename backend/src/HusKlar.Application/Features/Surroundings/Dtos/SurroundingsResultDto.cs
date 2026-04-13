namespace HusKlar.Application.Features.Surroundings.Dtos;

public record SurroundingsResultDto(
    string Address,
    CoordinatesDto Coordinates,
    List<SchoolDto> Schools,
    List<TransportStopDto> Transport,
    NoiseLevelDto NoiseLevel,
    AreaScoresDto Scores);

public record CoordinatesDto(double Lat, double Lng);

public record SchoolDto(string Name, string Type, int DistanceMeters);

public record TransportStopDto(string Name, string Type, int DistanceMeters, List<string> Lines);

public record NoiseLevelDto(int? RoadDb, int? RailDb, string Category);

public record AreaScoresDto(int Transport, int Schools, int Noise, int Overall);
