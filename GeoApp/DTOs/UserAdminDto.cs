namespace GeoApp.DTOs;

public class UserAdminDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public Guid RoleId { get; set; } 
    public string? RoleName { get; set; } 
    public List<Guid> PermissionIds { get; set; } = new(); 
    public List<string> PermissionCodes { get; set; } = new();
    public string? ZoneWkt { get; set; } 
    public DateTime CreatedAt { get; set; }
}