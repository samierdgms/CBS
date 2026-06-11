namespace GeoApp.DTOs;

public class RegisterDto
{
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public Guid? RoleId { get; set; } 
    public List<Guid>? PermissionIds { get; set; }
}