using GeoApp.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;

namespace GeoApp.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SimulationController : ControllerBase
{
    private readonly ISimulationService _simulationService;

    public SimulationController(ISimulationService simulationService)
    {
        _simulationService = simulationService;
    }

    
    
    [HttpPost("start/{routeId}")]
    public async Task<IActionResult> Start(int routeId, [FromQuery] string startWkt, [FromQuery] string connectionId)
    {
       
        if (string.IsNullOrEmpty(connectionId))
        {
            return BadRequest(new { message = "Bağlantı ID (connectionId) bulunamadı. Lütfen SignalR bağlantısını kontrol edin." });
        }

        try
        {
            
            var reader = new WKTReader();
            var startPoint = (Point)reader.Read(startWkt);

           
            await _simulationService.StartSimulationAsync(routeId, startPoint, connectionId);
            
            return Ok(new { message = "Simülasyon başarıyla başlatıldı." });
        }
        catch (Exception ex)
        {
            
            return BadRequest(new { message = $"Simülasyon başlatılırken hata oluştu: {ex.Message}" });
        }
    }
    
    [HttpPost("stop")]
    public IActionResult Stop([FromQuery] string connectionId)
    {
        // SimulationService içindeki o ConcurrentDictionary'den 
        // connectionId'yi bulup .Cancel() çağırmalıyız.
        _simulationService.StopSimulation(connectionId); 
        return Ok();
    }
}