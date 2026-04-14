using System.Text.Json;
using FluentValidation;

namespace HusKlar.Api.Middleware;

/// <summary>
/// Converts FluentValidation failures into user-friendly 400 responses with Danish error messages.
/// </summary>
public class ValidationExceptionMiddleware
{
    private readonly RequestDelegate _next;

    public ValidationExceptionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            context.Response.ContentType = "application/json";

            var firstError = ex.Errors.FirstOrDefault()?.ErrorMessage
                ?? "Ugyldigt input.";

            var response = new
            {
                data = (object?)null,
                error = firstError,
                success = false,
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}
