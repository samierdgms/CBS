namespace GeoApp.DTOs;

public class GeometryDto
{
    public int? Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string GeometryType { get; set; } = string.Empty;
    public string Wkt { get; set; } = string.Empty;
    public string? Note { get; set; } 
    public DateTime? CreatedAt { get; set; } 
    public DateTime? UpdatedAt { get; set; } 
    
    public string? Username { get; set; }
}