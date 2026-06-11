using System.ComponentModel.DataAnnotations.Schema;

namespace GeoApp.Models;

[Table("Geometries")] 
public class GeometryEntity : ISoftDeletable
{
    [Column("IsDeleted")]
    public bool IsDeleted { get; set; } = false;
    
    [Column("DeletedAt")]
    public DateTime? DeletedAt { get; set; }
    
    [Column("Id")]
    public int Id { get; set; }

    [Column("Name")]
    public string Name { get; set; } = string.Empty;

    [Column("GeometryType")]
    public string GeometryType { get; set; } = string.Empty;

    [Column("Geoloc")]
    public NetTopologySuite.Geometries.Geometry Geoloc { get; set; } = null!;

    [Column("UserId")]
    
    public Guid UserId { get; set; }
    public UserEntity User { get; set; } = null!;
    
    [Column("Note")] 
    public string? Note { get; set; }

    [Column("CreatedAt")] 
    public DateTime CreatedAt { get; set; }

    [Column("UpdatedAt")] 
    public DateTime? UpdatedAt { get; set; }
}