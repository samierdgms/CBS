namespace GeoApp.DTOs;

public class RoleUpdateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<Guid> PermissionIds { get; set; } = new();
}