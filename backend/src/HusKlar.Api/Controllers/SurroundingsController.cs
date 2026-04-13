using HusKlar.Application.Features.Surroundings.Queries.AutocompleteAddress;
using HusKlar.Application.Features.Surroundings.Queries.GetSurroundings;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace HusKlar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SurroundingsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SurroundingsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("autocomplete")]
    public async Task<IActionResult> Autocomplete(
        [FromQuery] string q, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
        {
            return Ok(new { data = Array.Empty<object>(), error = (string?)null, success = true });
        }

        var suggestions = await _mediator.Send(
            new AutocompleteAddressQuery(q.Trim()), cancellationToken);

        return Ok(new { data = suggestions, error = (string?)null, success = true });
    }

    [HttpGet]
    public async Task<IActionResult> GetSurroundings(
        [FromQuery] string address, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(address))
        {
            return BadRequest(new { data = (object?)null, error = "Indtast venligst en adresse.", success = false });
        }

        var result = await _mediator.Send(
            new GetSurroundingsQuery(address.Trim()), cancellationToken);

        if (!result.Success)
        {
            return UnprocessableEntity(new { data = (object?)null, error = result.Error, success = false });
        }

        return Ok(new { data = result.Data, error = (string?)null, success = true });
    }
}
