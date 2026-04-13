using HusKlar.Application.Features.Surroundings.Dtos;

namespace HusKlar.Application.Interfaces;

public interface ISurroundingsDataService
{
    Task<SurroundingsResultDto> GetSurroundingsAsync(
        double latitude, double longitude, string address,
        CancellationToken cancellationToken = default);
}
