using System.Net.Http.Json;
using System.Text.Json;
using HusKlar.Application.Interfaces;

namespace HusKlar.Infrastructure.Services.ExternalApis;

public class DawaGeocodingService : IGeocodingService
{
    private readonly HttpClient _httpClient;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public DawaGeocodingService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri("https://api.dataforsyningen.dk/");
    }

    public async Task<List<AddressSuggestion>> AutocompleteAsync(
        string query, CancellationToken cancellationToken = default)
    {
        var encoded = Uri.EscapeDataString(query);
        var response = await _httpClient.GetAsync(
            $"autocomplete?q={encoded}&type=adresse&per_side=6", cancellationToken);
        response.EnsureSuccessStatusCode();

        var results = await response.Content.ReadFromJsonAsync<List<DawaAutocompleteResult>>(
            JsonOptions, cancellationToken) ?? [];

        return results.Select(r => new AddressSuggestion(r.Tekst, r.Adresse?.Id ?? "")).ToList();
    }

    public async Task<GeocodedAddress?> GeocodeAsync(
        string address, CancellationToken cancellationToken = default)
    {
        var encoded = Uri.EscapeDataString(address);
        var response = await _httpClient.GetAsync(
            $"adresser?q={encoded}&per_side=1&struktur=mini", cancellationToken);
        response.EnsureSuccessStatusCode();

        var results = await response.Content.ReadFromJsonAsync<List<DawaAddressResult>>(
            JsonOptions, cancellationToken) ?? [];

        var first = results.FirstOrDefault();
        if (first is null) return null;

        return new GeocodedAddress(first.Betegnelse, first.Y, first.X);
    }

    private record DawaAutocompleteResult(string Tekst, DawaAutocompleteAdresse? Adresse);
    private record DawaAutocompleteAdresse(string Id);
    private record DawaAddressResult(string Betegnelse, double X, double Y);
}
