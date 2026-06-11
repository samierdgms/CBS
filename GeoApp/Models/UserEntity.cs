namespace GeoApp.Models;
using System.ComponentModel.DataAnnotations.Schema;
using NetTopologySuite.Geometries;
public class UserEntity : ISoftDeletable

{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty; 
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? ResetToken { get; set; }
    public DateTime? ResetTokenExpires { get; set; }
    
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    
    public ICollection<GeometryEntity> Geometries { get; set; } = new List<GeometryEntity>();
    public UserSettingsEntity? Settings { get; set; }
    
    public Guid RoleId { get; set; }
    public RoleEntity? Role { get; set; }
    public ICollection<UserPermission> UserPermissions { get; set; } = new List<UserPermission>();
    
    public Geometry? Zone { get; set; } 
    
    
    
    
}