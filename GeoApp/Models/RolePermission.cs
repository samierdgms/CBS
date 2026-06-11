namespace GeoApp.Models;

public class RolePermission
{
    public Guid RoleId { get; set; }
    public RoleEntity? Role { get; set; }
    public Guid PermissionId { get; set; }
    public PermissionEntity? Permission { get; set; }
}