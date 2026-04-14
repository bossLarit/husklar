using FluentValidation;

namespace HusKlar.Application.Features.Surroundings.Queries.GetSurroundings;

public class GetSurroundingsValidator : AbstractValidator<GetSurroundingsQuery>
{
    public GetSurroundingsValidator()
    {
        RuleFor(x => x.Address)
            .NotEmpty().WithMessage("Adresse er påkrævet.")
            .MinimumLength(3).WithMessage("Adressen skal være mindst 3 tegn.")
            .MaximumLength(200).WithMessage("Adressen må højst være 200 tegn.");
    }
}
