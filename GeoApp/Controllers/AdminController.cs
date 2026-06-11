using GeoApp.Data;
using GeoApp.DTOs;
using GeoApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GeoApp.Models;
using Microsoft.EntityFrameworkCore;

namespace GeoApp.Controllers;

[Authorize(Roles = "Admin")] 
[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly AppDbContext _context;
    public AdminController(IAuthService authService,AppDbContext context) {
        _authService = authService;
        _context = context; 
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _authService.GetAllUsersAsync();
        return Ok(users);
    }

    [HttpPut("users/{id}")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UserAdminDto dto)
    {
        var result = await _authService.UpdateUserByAdminAsync(id, dto);
        if (!result) return NotFound(new { message = "Kullanıcı bulunamadı." });
        return Ok(new { message = "Kullanıcı bilgileri ve yetkileri güncellendi." });
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] RegisterDto dto)
    {
        
        var user = await _authService.RegisterAsync(dto);
        return Ok(new { message = "Yeni kullanıcı oluşturuldu.", userId = user.Id });
    }
    
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var result = await _authService.DeleteUserAsync(id);
        if (!result) return NotFound(new { message = "Kullanıcı bulunamadı." });
        return Ok(new { message = "Kullanıcı ve ilişkili tüm veriler silindi." });
    }
    


    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _context.Roles.ToListAsync();
        return Ok(roles);
    }


    [HttpGet("permissions")]
    public async Task<IActionResult> GetPermissions()
    {
        var permissions = await _context.Permissions.ToListAsync();
        return Ok(permissions);
    }


    [HttpGet("roles/{roleId}/permissions")]
    public async Task<IActionResult> GetRolePermissions(Guid roleId)
    {
        var permissions = await _context.RolePermissions
            .Where(rp => rp.RoleId == roleId)
            .Select(rp => rp.PermissionId)
            .ToListAsync();
        return Ok(permissions);
    }
    
    [HttpPost("roles/manage")]
    public async Task<IActionResult> ManageRole([FromBody] RoleUpdateDto dto)
    {
        var result = await _authService.CreateOrUpdateRoleWithPermissionsAsync(dto);
        return result ? Ok(new { message = "Rol ve yetkiler güncellendi." }) : BadRequest();
    }

    [HttpDelete("roles/{id}")]
    public async Task<IActionResult> DeleteRole(Guid id)
    {
        
        var hasUsers = await _context.Users.AnyAsync(u => u.RoleId == id);
        if (hasUsers) return BadRequest(new { message = "Bu role bağlı kullanıcılar olduğu için silinemez!" });

        var role = await _context.Roles.FindAsync(id);
        if (role == null) return NotFound();

        _context.Roles.Remove(role);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Rol başarıyla silindi." });
    }
    [HttpGet("users/{id}/permissions")]
    public async Task<IActionResult> GetUserPermissions(Guid id)
    {
        
        var permissions = await _context.UserPermissions
            .Where(up => up.UserId == id)
            .Select(up => up.PermissionId)
            .ToListAsync();

        return Ok(permissions);
    }
    [HttpGet("users/paged")]
    public async Task<IActionResult> GetUsersPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null)
    {
        
        var query = _context.Users
            .Include(u => u.Role)
            .Include(u => u.UserPermissions)
                .ThenInclude(up => up.Permission)
            .Where(u => !u.IsDeleted) 
            .AsQueryable();

        
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(u => u.Username.Contains(search) || u.Email.Contains(search));
        }

        
        var totalCount = await query.CountAsync();

        
        var items = await query
            .OrderBy(u => u.Username)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new {
                u.Id,
                u.Username,
                u.Email,
                u.RoleId,
                RoleName = u.Role != null ? u.Role.Name : "",
                
                PermissionCodes = u.UserPermissions.Select(up => up.Permission.Name).ToList(),
                
                
                ZoneWkt = u.Zone != null ? u.Zone.ToString() : null 
            })
            .ToListAsync();

        
        return Ok(new PagedResultDto<object> { Items = items, TotalCount = totalCount });
    }

    [HttpGet("roles/paged")]
    public async Task<IActionResult> GetRolesPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = _context.Roles.Where(r => !r.IsDeleted).AsQueryable();
        
        var totalCount = await query.CountAsync();
        
        var items = await query
            .OrderBy(r => r.Name)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        
        return Ok(new PagedResultDto<RoleEntity> { Items = items, TotalCount = totalCount });
    }
    
    [HttpGet("logs/paged")]
    public async Task<IActionResult> GetLogsPaged(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10, 
        [FromQuery] string? searchUser = null,
        [FromQuery] string? method = null,
        [FromQuery] int? statusCode = null)
    {
        
        var query = from log in _context.AuditLogs
            join user in _context.Users on log.UserId equals user.Id.ToString() into userJoin
            from u in userJoin.DefaultIfEmpty()
            where !log.IsDeleted
            select new { log, Username = u != null ? u.Username : "Anonim/Sistem" };

        
        if (!string.IsNullOrEmpty(searchUser))
        {
            query = query.Where(x => x.Username.Contains(searchUser));
        }

       
        if (!string.IsNullOrEmpty(method))
        {
            query = query.Where(x => x.log.Method == method);
        }

        
        if (statusCode.HasValue)
        {
            query = query.Where(x => x.log.StatusCode == statusCode.Value);
        }

        var totalCount = await query.CountAsync();

        
        var items = await query
            .OrderByDescending(x => x.log.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new {
                x.log.Id,
                x.log.UserId,
                Username = x.Username, 
                x.log.Method,
                x.log.Path,
                x.log.QueryString,
                x.log.RequestBody,
                x.log.StatusCode,
                x.log.Exception,
                x.log.CreatedAt
            })
            .ToListAsync();

        return Ok(new PagedResultDto<object> { Items = items, TotalCount = totalCount });
    }

    [HttpDelete("logs/{id}")]
    public async Task<IActionResult> DeleteLog(int id)
    {
        var log = await _context.AuditLogs.FindAsync(id);
        if (log == null) return NotFound(new { message = "Log bulunamadı." });

        
        _context.AuditLogs.Remove(log);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Log başarıyla silindi." });
    }
    
    [HttpDelete("logs/clear-all")]
    public async Task<IActionResult> ClearAllLogs()
    {
        
        var activeLogs = await _context.AuditLogs.Where(l => !l.IsDeleted).ToListAsync();
    
        if (!activeLogs.Any()) 
            return Ok(new { message = "Temizlenecek log bulunamadı." });

        
        foreach (var log in activeLogs)
        {
            _context.AuditLogs.Remove(log);
        }
    
        await _context.SaveChangesAsync();

        return Ok(new { message = "Tüm loglar başarıyla temizlendi." });
    }
}
