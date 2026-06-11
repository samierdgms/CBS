namespace GeoApp.DTOs;

public class RouteDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? PathWkt { get; set; } 
    public List<StopDto> Stops { get; set; } = new();
}