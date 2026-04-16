namespace HusKlar.Application.Interfaces;

public interface IGeocodingService
{
    Task<List<AddressSuggestion>> AutocompleteAsync(string query, CancellationToken cancellationToken = default);
    Task<GeocodedAddress?> GeocodeAsync(string address, CancellationToken cancellationToken = default);
}

public record AddressSuggestion(string Text, string Id);
public record GeocodedAddress(string FullAddress, double Latitude, double Longitude, string? MunicipalityCode = null);
