using HusKlar.Application.Interfaces;
using HusKlar.Infrastructure.Data;
using HusKlar.Infrastructure.Services.Claude;
using HusKlar.Infrastructure.Services.ExternalApis;
using HusKlar.Infrastructure.Services.Pdf;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

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

        var databaseUrl = configuration["DATABASE_URL"];
        if (!string.IsNullOrWhiteSpace(databaseUrl))
        {
            var connectionString = BuildNpgsqlConnectionString(databaseUrl);
            services.AddSingleton<ICodesRepository>(new CodesRepository(connectionString));
        }
        else
        {
            services.AddSingleton<ICodesRepository, UnconfiguredCodesRepository>();
        }

        return services;
    }

    /// <summary>
    /// Converts a Supabase-style URL (postgresql://user:pass@host:port/db) into an Npgsql
    /// key/value connection string with SSL required. Passes through key=value input unchanged.
    /// </summary>
    private static string BuildNpgsqlConnectionString(string raw)
    {
        if (!raw.StartsWith("postgres://") && !raw.StartsWith("postgresql://"))
        {
            return raw;
        }

        var uri = new Uri(raw);
        var userInfo = uri.UserInfo.Split(':', 2);

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : 5432,
            Username = Uri.UnescapeDataString(userInfo[0]),
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
            Database = uri.AbsolutePath.TrimStart('/'),
            SslMode = SslMode.Require,
            Pooling = true,
            MaxPoolSize = 10,
        };

        return builder.ConnectionString;
    }
}
