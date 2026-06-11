using System.Security.Claims; 
using Microsoft.AspNetCore.Authorization; 
using GeoApp.Models;
using GeoApp.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace GeoApp.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UserSettingsController : ControllerBase
{
    private readonly IUserSettingsRepository _repository;
    public UserSettingsController(IUserSettingsRepository repository) => _repository = repository;

    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var settings = await _repository.GetSettingsByUserIdAsync(UserId); 
        if (settings == null)
        {
            
            return Ok(new UserSettingsEntity { UserId = UserId });
        }
        return Ok(settings);
    }

   
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UserSettingsEntity settings)
    {
        if (settings == null) return BadRequest("Veri boş geldi.");

        settings.UserId = UserId; 
    
       
        await _repository.UpdateSettingsAsync(settings);
    
        return Ok(new { message = "Başarıyla güncellendi." });
    }
}