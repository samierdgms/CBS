using System.Security.Claims; 
using Microsoft.AspNetCore.Authorization;
using GeoApp.DTOs;
using GeoApp.Services;
using Microsoft.AspNetCore.Mvc;

namespace GeoApp.Controllers;

[Authorize] 
[ApiController]
[Route("api/[controller]")]
public class GeometriesController : ControllerBase
{
    private readonly IGeometryService _service;
    private string UserRole => User.FindFirstValue(ClaimTypes.Role)!;
    public GeometriesController(IGeometryService service) => _service = service;

   
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    

    [HttpPost]
    public async Task<IActionResult> Create(GeometryDto dto)
    {
        try 
        {
            await _service.AddGeometryAsync(UserId, dto); 
            return Ok(new { message = "Geometri başarıyla kaydedildi." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _service.DeleteGeometryAsync(id, UserId, UserRole); 
        return Ok(new { message = "Geometri silindi." });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _service.GetGeometryByIdAsync(id, UserId, UserRole); 
        if (result == null) return NotFound(new { message = "Kayıt bulunamadı." });
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] GeometryDto dto)
    {
        try 
        {
            await _service.UpdateGeometryAsync(id, UserId, UserRole, dto); 
            return Ok(new { message = "Güncelleme başarılı!" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{id}/intersections")]
    public async Task<IActionResult> GetIntersections(int id)
    {
        var list = await _service.GetIntersectionsAsync(id, UserId, UserRole);
        return Ok(list);
    }
    
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? targetUserId = null) 
    {
        
        var userRole = User.FindFirstValue(ClaimTypes.Role)!;
    
        var results = await _service.GetAllGeometriesAsync(UserId, userRole, targetUserId);
        return Ok(results);
    }
    [HttpGet("paged")]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10, 
        [FromQuery] string? search = null,
        [FromQuery] string? type = null,
        [FromQuery] Guid? targetUserId = null) 
    {
        try 
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0) pageSize = 10;

            
            var result = await _service.GetAllGeometriesPagedAsync(
                UserId, 
                UserRole, 
                page, 
                pageSize, 
                search, 
                type, 
                targetUserId);

            return Ok(result);
        }
        catch (Exception ex)
        {
            
            return BadRequest(new { message = "Sayfalanmış veriler getirilirken bir hata oluştu: " + ex.Message });
        }
    }
}