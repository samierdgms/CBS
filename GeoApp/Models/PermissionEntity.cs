namespace GeoApp.Models;

public class PermissionEntity : ISoftDeletable
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty; 
    public string Code { get; set; } = string.Empty; 
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
}