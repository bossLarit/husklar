using FluentValidation;

namespace HusKlar.Application.Features.Surroundings.Queries.AutocompleteAddress;

public class AutocompleteAddressValidator : AbstractValidator<AutocompleteAddressQuery>
{
    public AutocompleteAddressValidator()
    {
        RuleFor(x => x.Query)
            .NotEmpty().WithMessage("Søgeord er påkrævet.")
            .MinimumLength(2).WithMessage("Indtast mindst 2 tegn.")
            .MaximumLength(100).WithMessage("Søgeordet er for langt.");
    }
}
