namespace GeoApp.Models;

public class RoleEntity :ISoftDeletable
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty; 
    
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public ICollection<RolePermission> RolePermissions { get; set; } = new List<RolePermission>();
    public ICollection<UserEntity> Users { get; set; } = new List<UserEntity>();
    
}