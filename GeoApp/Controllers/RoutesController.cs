using GeoApp.DTOs;
using GeoApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using GeoApp.Data;
using Microsoft.EntityFrameworkCore;

namespace GeoApp.Controllers;

[Authorize] 
[ApiController]
[Route("api/[controller]")]
public class RoutesController : ControllerBase
{
    private readonly IRouteService _routeService;
    private readonly AppDbContext _context;

    public RoutesController(IRouteService routeService, AppDbContext context)
    {
        _routeService = routeService;
        _context = context;
    }

  
    private Guid CurrentUserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private bool IsAdmin => User.IsInRole("Admin");

    [HttpGet]
    public async Task<IActionResult> GetAllRoutes()
    {
        var routes = await _routeService.GetAllRoutesAsync(CurrentUserId, IsAdmin);
        return Ok(routes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRouteById(int id)
    {
        
        var route = await _routeService.GetRouteByIdAsync(id, CurrentUserId, IsAdmin);
        if (route == null) return NotFound(new { message = "Güzergah bulunamadı." });
        return Ok(route);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRoute([FromBody] RouteDto dto)
    {
        try
        {
            var createdRoute = await _routeService.CreateRouteAsync(dto, CurrentUserId);
            return Ok(new { message = "Güzergah oluşturuldu.", route = createdRoute });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRoute(int id, [FromBody] RouteDto dto)
    {
        try
        {
            
            await _routeService.UpdateRouteAsync(id, dto, CurrentUserId, IsAdmin);
            return Ok(new { message = "Güzergah güncellendi." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRoute(int id)
    {
        try
        {
            
            await _routeService.DeleteRouteAsync(id, CurrentUserId, IsAdmin);
            return Ok(new { message = "Güzergah silindi." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/stops")]
    public async Task<IActionResult> AddStopToRoute(int id, [FromBody] StopDto dto)
    {
        try
        {
            
            await _routeService.AddStopToRouteAsync(id, dto, CurrentUserId, IsAdmin);
            return Ok(new { message = "Durak eklendi ve güzergah güncellendi." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}/stops/reorder")]
    public async Task<IActionResult> UpdateStopSortOrder(int id, [FromBody] List<int> stopIds)
    {
        try
        {
            
            await _routeService.UpdateStopSortOrderAsync(id, stopIds, CurrentUserId, IsAdmin);
            return Ok(new { message = "Durak sıralaması kaydedildi ve güzergah güncellendi." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/refresh-path")]
    public async Task<IActionResult> RefreshRoutePath(int id)
    {
        try
        {
            
            await _routeService.RefreshRoutePathAsync(id, CurrentUserId, IsAdmin);
            return Ok(new { message = "Güzergah yolu OSRM üzerinden yeniden hesaplandı." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{routeId}/stops/{stopId}")]
    public async Task<IActionResult> DeleteStop(int routeId, int stopId)
    {
        
        var stop = await _context.Stops
            .Include(s => s.Route)
            .FirstOrDefaultAsync(s => s.Id == stopId && (IsAdmin || s.UserId == CurrentUserId));
    
        if (stop == null) return Forbid(); 

        var routeIdRef = stop.RouteId;

        
        _context.Stops.Remove(stop); 
    
        
        await _context.SaveChangesAsync();
    
        
        _context.Entry(stop.Route).State = EntityState.Detached;
    
        
        await _routeService.RefreshRoutePathAsync(routeIdRef, CurrentUserId, IsAdmin); 
    
        return Ok();
    }

    [HttpPut("{routeId}/stops/{stopId}")]
    public async Task<IActionResult> UpdateStop(int routeId, int stopId, [FromBody] StopDto dto)
    {
        
        var stop = await _context.Stops
            .FirstOrDefaultAsync(s => s.Id == stopId && s.RouteId == routeId && (IsAdmin || s.UserId == CurrentUserId));
        
        if (stop == null) return NotFound(new { message = "Durak bulunamadı veya yetkiniz yok." });

        stop.Name = dto.Name; 
        
        if (!string.IsNullOrEmpty(dto.Wkt)) {
            var reader = new NetTopologySuite.IO.WKTReader();
            stop.Location = (NetTopologySuite.Geometries.Point)reader.Read(dto.Wkt);
        }
        
        
        await _context.SaveChangesAsync();
        await _routeService.RefreshRoutePathAsync(routeId, CurrentUserId, IsAdmin);
    
        return Ok(new { message = "Durak ismi güncellendi." });
    }
    
    [HttpPost("{id}/stops/insert")]
    public async Task<IActionResult> InsertStopToRoute(int id, [FromQuery] int targetOrder, [FromBody] StopDto dto)
    {
        try
        {
            
            await _routeService.InsertStopToRouteAsync(id, dto, targetOrder, CurrentUserId, IsAdmin);
        
            return Ok(new { 
                message = "Durak araya eklendi ve güzergah güncellendi." 
                
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}