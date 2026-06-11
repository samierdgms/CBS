namespace GeoApp.DTOs;

public class StopDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
    public string Wkt { get; set; } = string.Empty; 
}