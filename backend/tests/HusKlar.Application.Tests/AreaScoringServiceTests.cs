using HusKlar.Application.Features.Surroundings.Dtos;
using HusKlar.Infrastructure.Services.ExternalApis;

namespace HusKlar.Application.Tests;

public class AreaScoringServiceTests
{
    [Fact]
    public void Returns_null_scores_when_both_categories_unavailable()
    {
        var result = AreaScoringService.Calculate(
            [], [], new DataAvailabilityDto(SchoolsAvailable: false, TransportAvailable: false));

        Assert.Null(result.Transport);
        Assert.Null(result.Schools);
        Assert.Null(result.Overall);
    }

    [Fact]
    public void Returns_null_for_unavailable_category_but_real_score_for_available()
    {
        var transport = new List<TransportStopDto>
        {
            new("Station A", "togstation", 400, []),
        };

        var result = AreaScoringService.Calculate(
            transport, [], new DataAvailabilityDto(SchoolsAvailable: false, TransportAvailable: true));

        Assert.Null(result.Schools); // unavailable → null, not a fake low score
        Assert.Equal(10, result.Transport); // 400m is within ideal 500m
        Assert.Equal(10, result.Overall); // only transport counts
    }

    [Fact]
    public void Empty_list_with_available_data_gets_real_low_score()
    {
        // "Data available but nothing found in range" is a legitimate 2/10
        var result = AreaScoringService.Calculate(
            [], [], new DataAvailabilityDto(SchoolsAvailable: true, TransportAvailable: true));

        Assert.Equal(2, result.Transport);
        Assert.Equal(2, result.Schools);
        Assert.NotNull(result.Overall);
    }

    [Fact]
    public void Overall_averages_only_available_categories()
    {
        var schools = new List<SchoolDto> { new("Skole", "folkeskole", 400) };
        var transport = new List<TransportStopDto> { new("Stop", "busstop", 3000, []) };

        var result = AreaScoringService.Calculate(
            transport, schools, new DataAvailabilityDto(SchoolsAvailable: true, TransportAvailable: true));

        // Schools: 10, Transport: 2, Noise: null. Average of available = (10+2)/2 = 6
        Assert.Equal(10, result.Schools);
        Assert.Equal(2, result.Transport);
        Assert.Null(result.Noise);
        Assert.Equal(6, result.Overall);
    }
}
