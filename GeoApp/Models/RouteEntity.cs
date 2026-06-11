using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace GeoApp.Models;

[Table("Routes")]
public class RouteEntity : ISoftDeletable
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#3388ff"; 
    
  
    public LineString? Path { get; set; } 

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Guid UserId { get; set; }
    
    public ICollection<StopEntity> Stops { get; set; } = new List<StopEntity>();
}