using System.Text;
using HusKlar.Application.Interfaces;
using UglyToad.PdfPig;

namespace HusKlar.Infrastructure.Services.Pdf;

public class PdfPigTextExtractor : IPdfTextExtractor
{
    public Task<string> ExtractTextAsync(Stream pdfStream, CancellationToken cancellationToken = default)
    {
        using var document = PdfDocument.Open(pdfStream);
        var sb = new StringBuilder();

        foreach (var page in document.GetPages())
        {
            cancellationToken.ThrowIfCancellationRequested();
            sb.AppendLine(page.Text);
        }

        return Task.FromResult(sb.ToString());
    }
}
