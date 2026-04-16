using HusKlar.Application.Features.Surroundings.Dtos;
using HusKlar.Application.Interfaces;
using HusKlar.Infrastructure.Services.ExternalApis;

namespace HusKlar.Application.Tests;

public class AreaScoringServiceTests
{
    private static DataAvailabilityDto Availability(
        bool schools = false, bool transport = false,
        bool shopping = false, bool nature = false, bool crime = false) =>
        new(schools, transport, shopping, nature, crime);

    [Fact]
    public void Returns_null_scores_when_all_categories_unavailable()
    {
        var result = AreaScoringService.Calculate([], [], [], [], crime: null, Availability());

        Assert.Null(result.Transport);
        Assert.Null(result.Schools);
        Assert.Null(result.Shopping);
        Assert.Null(result.Nature);
        Assert.Null(result.Crime);
        Assert.Null(result.Overall);
    }

    [Fact]
    public void Returns_null_for_unavailable_category_but_real_score_for_available()
    {
        var transport = new List<TransportStopDto> { new("Station A", "togstation", 400, []) };

        var result = AreaScoringService.Calculate(
            transport, [], [], [], crime: null,
            Availability(transport: true));

        Assert.Null(result.Schools);
        Assert.Null(result.Shopping);
        Assert.Null(result.Nature);
        Assert.Equal(10, result.Transport);
        Assert.Equal(10, result.Overall);
    }

    [Fact]
    public void Empty_list_with_available_data_gets_real_low_score()
    {
        var result = AreaScoringService.Calculate(
            [], [], [], [], crime: null,
            Availability(schools: true, transport: true, shopping: true, nature: true));

        Assert.Equal(2, result.Transport);
        Assert.Equal(2, result.Schools);
        Assert.Equal(2, result.Shopping);
        Assert.Equal(2, result.Nature);
        Assert.NotNull(result.Overall);
    }

    [Fact]
    public void Overall_averages_only_available_categories()
    {
        var schools = new List<SchoolDto> { new("Skole", "folkeskole", 400) };
        var transport = new List<TransportStopDto> { new("Stop", "busstop", 3000, []) };

        var result = AreaScoringService.Calculate(
            transport, schools, [], [], crime: null,
            Availability(schools: true, transport: true));

        Assert.Equal(10, result.Schools);
        Assert.Equal(2, result.Transport);
        Assert.Null(result.Noise);
        Assert.Equal(6, result.Overall);
    }

    [Fact]
    public void Shopping_within_ideal_distance_scores_ten()
    {
        var shops = new List<ShopDto> { new("Netto", "supermarked", 300) };

        var result = AreaScoringService.Calculate(
            [], [], shops, [], crime: null,
            Availability(shopping: true));

        Assert.Equal(10, result.Shopping);
    }

    [Fact]
    public void Nature_uses_lenient_thresholds()
    {
        var nature = new List<NatureAreaDto> { new("Skov", "skov", 800) };

        var result = AreaScoringService.Calculate(
            [], [], [], nature, crime: null,
            Availability(nature: true));

        Assert.Equal(10, result.Nature);
    }

    [Fact]
    public void Crime_low_burglary_rate_scores_high()
    {
        var crime = new CrimeStatisticsResult("Gentofte", 2024, 2.0, 30.0);

        var result = AreaScoringService.Calculate(
            [], [], [], [], crime,
            Availability(crime: true));

        Assert.Equal(10, result.Crime);
    }

    [Fact]
    public void Crime_high_burglary_rate_scores_low()
    {
        var crime = new CrimeStatisticsResult("Test", 2024, 12.0, 80.0);

        var result = AreaScoringService.Calculate(
            [], [], [], [], crime,
            Availability(crime: true));

        Assert.Equal(2, result.Crime);
    }

    [Fact]
    public void Crime_unavailable_returns_null()
    {
        var result = AreaScoringService.Calculate(
            [], [], [], [], crime: null,
            Availability(schools: true));

        Assert.Null(result.Crime);
    }

    [Fact]
    public void Partial_availability_overall_only_averages_available()
    {
        var schools = new List<SchoolDto> { new("Skole", "folkeskole", 1500) };
        var nature = new List<NatureAreaDto> { new("Park", "park", 800) };

        var result = AreaScoringService.Calculate(
            [], schools, [], nature, crime: null,
            Availability(schools: true, nature: true));

        Assert.NotNull(result.Schools);
        Assert.Equal(10, result.Nature);
        Assert.Null(result.Transport);
        Assert.Null(result.Shopping);
        Assert.Null(result.Crime);
        Assert.Equal((int)Math.Round((result.Schools!.Value + 10) / 2.0), result.Overall);
    }
}
