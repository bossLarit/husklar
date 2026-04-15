using System.Security.Cryptography;
using System.Text;
using HusKlar.Application.Interfaces;
using Npgsql;

namespace HusKlar.Infrastructure.Data;

/// <summary>
/// Npgsql-based codes repository. Codes follow the format "HUS-XXXXXXXX" where X is
/// Crockford-base32 (no I/L/O/U to avoid confusion).
/// </summary>
public class CodesRepository : ICodesRepository
{
    // Crockford base32 without I, L, O, U — 32 symbols, human-friendly
    private const string Alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    private const int SuffixLength = 8;
    private const string Prefix = "HUS-";

    private readonly string _connectionString;

    public CodesRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<bool> IsValidAsync(string code, CancellationToken cancellationToken = default)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken);

        const string sql = "SELECT 1 FROM codes WHERE code = @code AND is_used = FALSE LIMIT 1";
        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@code", code);

        var result = await cmd.ExecuteScalarAsync(cancellationToken);
        return result is not null;
    }

    public async Task<bool> TryConsumeAsync(string code, CancellationToken cancellationToken = default)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken);

        const string sql = @"
            UPDATE codes
            SET is_used = TRUE, used_at = NOW()
            WHERE code = @code AND is_used = FALSE
            RETURNING code";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@code", code);

        var result = await cmd.ExecuteScalarAsync(cancellationToken);
        return result is not null;
    }

    public async Task RefundAsync(string code, CancellationToken cancellationToken = default)
    {
        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken);

        // WHERE is_used = TRUE makes the refund idempotent: calling refund on an already-free
        // code is a no-op instead of silently "un-freeing" what was never consumed.
        const string sql = @"
            UPDATE codes
            SET is_used = FALSE, used_at = NULL
            WHERE code = @code AND is_used = TRUE";

        await using var cmd = new NpgsqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@code", code);
        await cmd.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<string>> GenerateAsync(
        int count,
        string? note,
        CancellationToken cancellationToken = default)
    {
        if (count < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(count), "Count must be at least 1.");
        }

        await using var conn = new NpgsqlConnection(_connectionString);
        await conn.OpenAsync(cancellationToken);
        await using var tx = await conn.BeginTransactionAsync(cancellationToken);

        var generated = new List<string>(count);
        const int maxAttemptsPerCode = 5;

        for (int i = 0; i < count; i++)
        {
            string? inserted = null;
            for (int attempt = 0; attempt < maxAttemptsPerCode && inserted is null; attempt++)
            {
                var candidate = GenerateCode();

                const string sql = @"
                    INSERT INTO codes (code, note)
                    VALUES (@code, @note)
                    ON CONFLICT (code) DO NOTHING
                    RETURNING code";

                await using var cmd = new NpgsqlCommand(sql, conn, tx);
                cmd.Parameters.AddWithValue("@code", candidate);
                cmd.Parameters.AddWithValue("@note", (object?)note ?? DBNull.Value);

                var result = await cmd.ExecuteScalarAsync(cancellationToken);
                if (result is not null)
                {
                    inserted = candidate;
                }
            }

            if (inserted is null)
            {
                throw new InvalidOperationException(
                    $"Failed to generate a unique code after {maxAttemptsPerCode} attempts.");
            }
            generated.Add(inserted);
        }

        await tx.CommitAsync(cancellationToken);
        return generated;
    }

    private static string GenerateCode()
    {
        var bytes = RandomNumberGenerator.GetBytes(SuffixLength);
        var sb = new StringBuilder(Prefix.Length + SuffixLength);
        sb.Append(Prefix);
        for (int i = 0; i < SuffixLength; i++)
        {
            sb.Append(Alphabet[bytes[i] % Alphabet.Length]);
        }
        return sb.ToString();
    }
}
