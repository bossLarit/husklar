using HusKlar.Application.Interfaces;
using MediatR;

namespace HusKlar.Application.Features.Surroundings.Queries.AutocompleteAddress;

public record AutocompleteAddressQuery(string Query) : IRequest<List<AddressSuggestion>>;

public class AutocompleteAddressHandler : IRequestHandler<AutocompleteAddressQuery, List<AddressSuggestion>>
{
    private readonly IGeocodingService _geocoding;

    public AutocompleteAddressHandler(IGeocodingService geocoding)
    {
        _geocoding = geocoding;
    }

    public Task<List<AddressSuggestion>> Handle(
        AutocompleteAddressQuery request, CancellationToken cancellationToken)
    {
        return _geocoding.AutocompleteAsync(request.Query, cancellationToken);
    }
}
