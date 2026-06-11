namespace GeoApp.Models;

public class UserPermission
{
    public Guid UserId { get; set; }
    public UserEntity? User { get; set; }
    public Guid PermissionId { get; set; }
    public PermissionEntity? Permission { get; set; }
}