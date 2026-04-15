namespace HusKlar.Application.Interfaces;

public interface ICodesRepository
{
    /// <summary>
    /// Checks whether a code exists and is unused, without consuming it.
    /// </summary>
    Task<bool> IsValidAsync(string code, CancellationToken cancellationToken = default);

    /// <summary>
    /// Atomically marks the code as used. Returns true if the code existed and was unused;
    /// false if the code is invalid or already consumed. Race-safe against concurrent callers.
    /// </summary>
    Task<bool> TryConsumeAsync(string code, CancellationToken cancellationToken = default);

    /// <summary>
    /// Reverts a previously-consumed code back to unused. Intended for use when the
    /// caller consumed a code but subsequent work failed (e.g. Claude API error).
    /// </summary>
    Task RefundAsync(string code, CancellationToken cancellationToken = default);

    /// <summary>
    /// Generates and inserts <paramref name="count"/> new unused codes, optionally tagged
    /// with a human-readable note. Returns the new code strings in insertion order.
    /// </summary>
    Task<IReadOnlyList<string>> GenerateAsync(
        int count,
        string? note,
        CancellationToken cancellationToken = default);
}
