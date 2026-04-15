using HusKlar.Application.Interfaces;

namespace HusKlar.Infrastructure.Data;

/// <summary>
/// Used when DATABASE_URL is not configured. Lets the app start (so the owner-only
/// access-code flow still works) but throws a clear error when any database-backed
/// code operation is attempted.
/// </summary>
public class UnconfiguredCodesRepository : ICodesRepository
{
    private const string Message =
        "Database er ikke konfigureret. Sæt DATABASE_URL env var for at aktivere engangs-koder.";

    public Task<bool> IsValidAsync(string code, CancellationToken cancellationToken = default)
        => throw new InvalidOperationException(Message);

    public Task<bool> TryConsumeAsync(string code, CancellationToken cancellationToken = default)
        => throw new InvalidOperationException(Message);

    public Task RefundAsync(string code, CancellationToken cancellationToken = default)
        => throw new InvalidOperationException(Message);

    public Task<IReadOnlyList<string>> GenerateAsync(
        int count,
        string? note,
        CancellationToken cancellationToken = default)
        => throw new InvalidOperationException(Message);
}
