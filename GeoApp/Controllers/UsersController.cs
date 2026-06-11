using System.Security.Claims;
using GeoApp.Data;
using GeoApp.DTOs;
using GeoApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GeoApp.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly AppDbContext _context;
    public UsersController(IAuthService authService,AppDbContext context) {
        _authService = authService;
        _context = context; 
    }

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        
        var user = await _context.Users
            .Include(u => u.Role)
            .Include(u => u.UserPermissions)
            .ThenInclude(up => up.Permission)
            .FirstOrDefaultAsync(u => u.Id == UserId);

        if (user == null) return NotFound(new { message = "Kullanıcı bulunamadı." });

        var wktWriter = new NetTopologySuite.IO.WKTWriter();

        return Ok(new { 
            user.Username, 
            user.Email, 
            Role = user.Role?.Name, 
            user.CreatedAt,
            Permissions = user.UserPermissions.Select(up => up.Permission!.Code).ToList(), 
            ZoneWkt = user.Zone != null ? wktWriter.Write(user.Zone) : null 
        });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UserUpdateDto dto)
    {
        var result = await _authService.UpdateUserProfileAsync(UserId, dto);
        if (!result) return BadRequest(new { message = "Profil güncellenemedi." });
        return Ok(new { message = "Profil başarıyla güncellendi." });
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordDto dto)
    {
        var result = await _authService.ChangePasswordAsync(UserId, dto);
        if (!result) return BadRequest(new { message = "Mevcut şifre hatalı veya işlem başarısız." });
        return Ok(new { message = "Şifreniz başarıyla değiştirildi." });
    }
}