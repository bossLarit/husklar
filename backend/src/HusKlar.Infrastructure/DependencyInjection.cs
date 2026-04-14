using HusKlar.Application.Interfaces;
using HusKlar.Infrastructure.Services.Claude;
using HusKlar.Infrastructure.Services.ExternalApis;
using HusKlar.Infrastructure.Services.Pdf;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace HusKlar.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddScoped<IPdfTextExtractor, PdfPigTextExtractor>();
        services.AddHttpClient<IClaudeAnalysisService, ClaudeAnalysisService>();
        services.AddHttpClient<IGeocodingService, DawaGeocodingService>();
        services.AddHttpClient<OverpassClient>();
        services.AddScoped<ISurroundingsDataService, SurroundingsDataService>();

        return services;
    }
}
