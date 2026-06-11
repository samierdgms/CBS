using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;

namespace GeoApp.Models;

[Table("Stops")]
public class StopEntity : ISoftDeletable
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; } 
    
   
    public Point Location { get; set; } = null!; 

    public int RouteId { get; set; }
    public RouteEntity Route { get; set; } = null!;

    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    
    public Guid UserId { get; set; }
}