using GeoApp.Data;
using GeoApp.DTOs;
using GeoApp.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Security.Cryptography;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using NetTopologySuite.IO; 

namespace GeoApp.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    
    
    private readonly WKTReader _wktReader = new();
    private readonly WKTWriter _wktWriter = new();

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<UserEntity> RegisterAsync(RegisterDto dto)
{
    string salt = BCrypt.Net.BCrypt.GenerateSalt(12);
    string hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password, salt);
    
    Guid targetRoleId;
    List<Guid> finalPermissionIds = new();

    if (dto.RoleId.HasValue && dto.RoleId.Value != Guid.Empty)
    {
        
        targetRoleId = dto.RoleId.Value;
        if (dto.PermissionIds != null) finalPermissionIds = dto.PermissionIds;
    }
    else
    {
        
        var defaultRole = await _context.Roles
            .Include(r => r.RolePermissions) 
            .FirstOrDefaultAsync(r => r.Name == "User");

        if (defaultRole == null) throw new Exception("Varsayılan rol bulunamadı.");
        
        targetRoleId = defaultRole.Id;
        
        
        if (defaultRole.RolePermissions != null)
        {
            finalPermissionIds = defaultRole.RolePermissions
                .Select(rp => rp.PermissionId)
                .ToList();
        }
    }

    var user = new UserEntity
    {
        Username = dto.Username,
        Email = dto.Email,
        PasswordHash = hashedPassword,
        CreatedAt = DateTime.UtcNow,
        RoleId = targetRoleId 
    };

    _context.Users.Add(user);
    await _context.SaveChangesAsync(); 

    
    if (finalPermissionIds.Any())
    {
        foreach (var pId in finalPermissionIds)
        {
            _context.UserPermissions.Add(new UserPermission
            {
                UserId = user.Id,
                PermissionId = pId
            });
        }
        await _context.SaveChangesAsync(); 
    }

    
    var defaultSettings = new UserSettingsEntity
    {
        UserId = user.Id, 
        LastSelectedCountry = "Turkey",
        PreferredBaseLayer = "OSM",
        Theme = "light",
        Language = "tr"
    };
    _context.UserSettings.Add(defaultSettings);
    await _context.SaveChangesAsync();

    return user;
}

    public async Task<string?> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users
            .Include(u => u.Role) 
            .FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null) return null;

        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!isPasswordValid) return null;

        return GenerateJwtToken(user); 
    }

    private string GenerateJwtToken(UserEntity user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), 
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role?.Name ?? "User") 
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddMinutes(Convert.ToDouble(_configuration["Jwt:DurationInMinutes"])),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    

    public async Task<UserEntity?> GetUserByIdAsync(Guid userId)
    {
        return await _context.Users.FindAsync(userId);
    }
    public async Task<UserEntity?> GetUserByEmailAsync(string email)
    {
        
        return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<bool> UpdateUserProfileAsync(Guid userId, UserUpdateDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return false;

        user.Username = dto.Username;
        user.Email = dto.Email;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ChangePasswordAsync(Guid userId, ChangePasswordDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return false;

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.PasswordHash))
            return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _context.SaveChangesAsync();
        return true;
    }

    

    public async Task<IEnumerable<UserAdminDto>> GetAllUsersAsync()
    {
        
        var users = await _context.Users
            .Include(u => u.Role)
            .Include(u => u.UserPermissions)
            .ThenInclude(up => up.Permission)
            .ToListAsync();

        return users.Select(u => new UserAdminDto
        {
            Id = u.Id,
            Username = u.Username,
            Email = u.Email,
            RoleId = u.RoleId, 
            RoleName = u.Role?.Name ?? "User", 
            ZoneWkt = u.Zone != null ? _wktWriter.Write(u.Zone) : null,
            CreatedAt = u.CreatedAt,
            
            PermissionCodes = u.UserPermissions
                .Select(up => up.Permission!.Code)
                .ToList()
        });
    }

    public async Task<bool> UpdateUserByAdminAsync(Guid userId, UserAdminDto dto)
    {
        
        var user = await _context.Users
            .Include(u => u.UserPermissions)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return false;

        
        user.Username = dto.Username;
        user.Email = dto.Email;
        user.RoleId = dto.RoleId; 
        
        _context.UserPermissions.RemoveRange(user.UserPermissions);

        
        if (dto.PermissionIds != null && dto.PermissionIds.Any())
        {
            foreach (var pId in dto.PermissionIds)
            {
                user.UserPermissions.Add(new UserPermission 
                { 
                    UserId = userId, 
                    PermissionId = pId 
                });
            }
        }

        
        if (!string.IsNullOrEmpty(dto.ZoneWkt))
            user.Zone = _wktReader.Read(dto.ZoneWkt);
        else
            user.Zone = null;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteUserAsync(Guid userId)
    {
        var user = await _context.Users
            .Include(u => u.Geometries) 
            .Include(u => u.Settings)   
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null) return false;

        
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }

    

    public async Task<bool> ForgotPasswordAsync(string email)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null) return false;

        user.ResetToken = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        user.ResetTokenExpires = DateTime.UtcNow.AddHours(1);

        await _context.SaveChangesAsync();
        return await SendResetEmailAsync(user.Email, user.ResetToken);
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordDto dto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => 
            u.ResetToken == dto.Token && u.ResetTokenExpires > DateTime.UtcNow);
    
        if (user == null) return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.ResetToken = null; 
        user.ResetTokenExpires = null;

        await _context.SaveChangesAsync();
        return true;
    }

    private async Task<bool> SendResetEmailAsync(string email, string token)
    {
        try {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress("GeoApp Destek", emailSettings["SenderEmail"]));
            message.To.Add(new MailboxAddress("", email));
            message.Subject = "Şifre Sıfırlama Talebi";
            message.Body = new TextPart("plain") { Text = $"Şifrenizi sıfırlamak için token kodunuz: {token}" };

            using var client = new SmtpClient();
            await client.ConnectAsync(emailSettings["SmtpServer"], int.Parse(emailSettings["SmtpPort"]), SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(emailSettings["Username"], emailSettings["Password"]);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            return true;
        } catch (Exception ex) {
            Console.WriteLine($"Mail Hatası: {ex.Message}");
            return false;
        }
    }
    
    public async Task<bool> CreateOrUpdateRoleWithPermissionsAsync(RoleUpdateDto dto)
    {
        RoleEntity? role;
        if (dto.Id == Guid.Empty) {
            role = new RoleEntity { Name = dto.Name };
            _context.Roles.Add(role);
        } else {
            role = await _context.Roles.Include(r => r.RolePermissions).FirstOrDefaultAsync(r => r.Id == dto.Id);
            if (role == null) return false;
            role.Name = dto.Name;
            _context.RolePermissions.RemoveRange(role.RolePermissions); 
        }

        await _context.SaveChangesAsync(); 

        if (dto.PermissionIds.Any()) {
            foreach (var pId in dto.PermissionIds) {
                _context.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = pId });
            }
            await _context.SaveChangesAsync();
        }
        return true;
    }
}