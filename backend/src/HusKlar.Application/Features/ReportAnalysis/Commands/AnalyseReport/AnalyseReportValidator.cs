using FluentValidation;

namespace HusKlar.Application.Features.ReportAnalysis.Commands.AnalyseReport;

public class AnalyseReportValidator : AbstractValidator<AnalyseReportCommand>
{
    private static readonly string[] AllowedTypes = ["tilstandsrapport", "elrapport"];

    public AnalyseReportValidator()
    {
        RuleFor(x => x.PdfStream)
            .NotNull().WithMessage("PDF-stream er påkrævet.");

        RuleFor(x => x.ReportType)
            .NotEmpty().WithMessage("Rapporttype er påkrævet.")
            .Must(t => AllowedTypes.Contains(t))
            .WithMessage("Ugyldig rapporttype. Skal være 'tilstandsrapport' eller 'elrapport'.");
    }
}
