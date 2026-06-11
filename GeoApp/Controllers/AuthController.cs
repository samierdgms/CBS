using GeoApp.DTOs;
using GeoApp.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace GeoApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        try 
        {
            var user = await _authService.RegisterAsync(dto);
            return Ok(new { message = "Kayıt başarılı! Hoş geldin, " + user.Username });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Kayıt başarısız: " + ex.Message });
        }
    }
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
       
        var user = await _authService.GetUserByEmailAsync(dto.Email); 
    
        var token = await _authService.LoginAsync(dto);
    
        if (token == null || user == null)
        {
            return Unauthorized(new { message = "E-posta veya şifre hatalı." });
        }

        return Ok(new { 
            token = token, 
            userId = user.Id,
            username = user.Username,
            message = "Giriş başarılı!" 
        });
    }
    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto) 
    {
        
        var result = await _authService.ForgotPasswordAsync(dto.Email);

        if (!result) 
            return BadRequest(new { message = "Mail gönderimi başarısız oldu. E-posta adresini kontrol edin." });
    
        return Ok(new { message = "Sıfırlama kodu e-posta adresinize gönderilmiştir." });
    }
    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
    {
        var result = await _authService.ResetPasswordAsync(dto);
        if (!result) return BadRequest(new { message = "Geçersiz veya süresi dolmuş token." });

        return Ok(new { message = "Şifreniz başarıyla güncellendi." });
    }
}