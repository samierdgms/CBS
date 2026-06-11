using GeoApp.DTOs;
using GeoApp.Models;

namespace GeoApp.Services;

public interface IAuthService
{
    Task<UserEntity> RegisterAsync(RegisterDto dto);
    Task<string?> LoginAsync(LoginDto dto); 
    Task<bool> ForgotPasswordAsync(string email);
    Task<bool> ResetPasswordAsync(ResetPasswordDto dto);
    
    Task<UserEntity?> GetUserByIdAsync(Guid userId);
    Task<bool> UpdateUserProfileAsync(Guid userId, UserUpdateDto dto);
    Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordDto dto);
    
    Task<IEnumerable<UserAdminDto>> GetAllUsersAsync();
    Task<bool> UpdateUserByAdminAsync(Guid userId, UserAdminDto dto);
    
    Task<bool> DeleteUserAsync(Guid userId);
    
    Task<UserEntity?> GetUserByEmailAsync(string email);

    Task<bool> CreateOrUpdateRoleWithPermissionsAsync(RoleUpdateDto dto);
}