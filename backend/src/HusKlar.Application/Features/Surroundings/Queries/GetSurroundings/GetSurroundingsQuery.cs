using HusKlar.Application.Common;
using HusKlar.Application.Features.Surroundings.Dtos;
using HusKlar.Application.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace HusKlar.Application.Features.Surroundings.Queries.GetSurroundings;

public record GetSurroundingsQuery(string Address) : IRequest<Result<SurroundingsResultDto>>;

public class GetSurroundingsHandler : IRequestHandler<GetSurroundingsQuery, Result<SurroundingsResultDto>>
{
    private readonly IGeocodingService _geocoding;
    private readonly ISurroundingsDataService _surroundings;
    private readonly ILogger<GetSurroundingsHandler> _logger;

    public GetSurroundingsHandler(
        IGeocodingService geocoding,
        ISurroundingsDataService surroundings,
        ILogger<GetSurroundingsHandler> logger)
    {
        _geocoding = geocoding;
        _surroundings = surroundings;
        _logger = logger;
    }

    public async Task<Result<SurroundingsResultDto>> Handle(
        GetSurroundingsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var geocoded = await _geocoding.GeocodeAsync(request.Address, cancellationToken);
            if (geocoded is null)
            {
                return Result<SurroundingsResultDto>.Fail(
                    "Adressen kunne ikke findes. Prøv at skrive den mere præcist.");
            }

            _logger.LogInformation("Fetching surroundings for {Address} ({Lat}, {Lng})",
                geocoded.FullAddress, geocoded.Latitude, geocoded.Longitude);

            var result = await _surroundings.GetSurroundingsAsync(
                geocoded.Latitude, geocoded.Longitude, geocoded.FullAddress,
                geocoded.MunicipalityCode, cancellationToken);

            return Result<SurroundingsResultDto>.Ok(result);
        }
        catch (ExternalServiceUnavailableException ex)
        {
            _logger.LogWarning(ex, "Overpass completely unavailable");
            return Result<SurroundingsResultDto>.Fail(
                "Kortdata er midlertidigt utilgængelige (OpenStreetMap-serverne er overbelastede). Prøv igen om et minut.");
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "External API request failed for surroundings");
            return Result<SurroundingsResultDto>.Fail(
                "Kunne ikke hente data om omgivelserne. Prøv venligst igen om lidt.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error fetching surroundings");
            return Result<SurroundingsResultDto>.Fail(
                "Der opstod en uventet fejl. Prøv venligst igen.");
        }
    }
}
