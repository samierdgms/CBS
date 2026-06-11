using GeoApp.DTOs;
using GeoApp.Models;
using GeoApp.Repositories;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;
using System.Text.Json;

namespace GeoApp.Services;

public class RouteService : IRouteService
{
    private readonly IRouteRepository _repository;
    private readonly HttpClient _httpClient;
    private readonly WKTReader _wktReader = new();
    private readonly WKTWriter _wktWriter = new();

    public RouteService(IRouteRepository repository, HttpClient httpClient)
    {
        _repository = repository;
        _httpClient = httpClient;
    }

    public async Task<RouteDto> CreateRouteAsync(RouteDto dto, Guid userId)
    {
        var entity = new RouteEntity
        {
            Name = dto.Name,
            UserId = userId, 
            Color = string.IsNullOrEmpty(dto.Color) ? "#3388ff" : dto.Color,
            CreatedAt = DateTime.UtcNow
        };

        await _repository.AddAsync(entity);
        dto.Id = entity.Id;
        return dto;
    }

    public async Task<RouteDto?> GetRouteByIdAsync(int id, Guid userId, bool isAdmin)
    {
        
        var entity = await _repository.GetByIdAsync(id, userId, isAdmin);
        if (entity == null) return null;

        return MapToDto(entity);
    }

    public async Task<IEnumerable<RouteDto>> GetAllRoutesAsync(Guid userId, bool isAdmin)
    {
       
        var entities = await _repository.GetAllAsync(userId, isAdmin);
        return entities.Select(MapToDto);
    }

    public async Task UpdateRouteAsync(int id, RouteDto dto, Guid userId, bool isAdmin)
    {
        var entity = await _repository.GetByIdAsync(id, userId, isAdmin);
        if (entity == null) throw new Exception("Güzergah bulunamadı veya yetkiniz yok.");

        entity.Name = dto.Name;
        entity.Color = dto.Color;

        await _repository.UpdateAsync(entity);
    }

    public async Task DeleteRouteAsync(int id, Guid userId, bool isAdmin)
    {
        
        await _repository.DeleteAsync(id, userId, isAdmin);
    }

    public async Task AddStopToRouteAsync(int routeId, StopDto stopDto, Guid userId, bool isAdmin)
    {
        var route = await _repository.GetByIdAsync(routeId, userId, isAdmin);
        if (route == null) throw new Exception("Güzergah bulunamadı veya yetkiniz yok.");

        var stop = new StopEntity
        {
            Name = stopDto.Name,
            Location = (Point)_wktReader.Read(stopDto.Wkt),
            RouteId = routeId,
            UserId = userId, 
            Order = route.Stops.Count + 1 
        };

        route.Stops.Add(stop);
        await _repository.UpdateAsync(route);
        
        await RefreshRoutePathAsync(routeId, userId, isAdmin);
    }

    public async Task UpdateStopSortOrderAsync(int routeId, List<int> stopIds, Guid userId, bool isAdmin)
    {
        
        var stops = (await _repository.GetStopsByRouteIdAsync(routeId, userId, isAdmin)).ToList();
        
        for (int i = 0; i < stopIds.Count; i++)
        {
            var stop = stops.FirstOrDefault(s => s.Id == stopIds[i]);
            if (stop != null) stop.Order = i + 1;
        }

        await _repository.UpdateStopOrderAsync(stops);
        await RefreshRoutePathAsync(routeId, userId, isAdmin);
    }

    public async Task RefreshRoutePathAsync(int routeId, Guid userId, bool isAdmin)
    {
        var route = await _repository.GetByIdAsync(routeId, userId, isAdmin);
        if (route == null || route.Stops.Count < 2) return;

        var coords = route.Stops.OrderBy(s => s.Order)
            .Select(s => $"{s.Location.X.ToString().Replace(",", ".")},{s.Location.Y.ToString().Replace(",", ".")}");
        
        string osrmUrl = $"http://localhost:5000/route/v1/driving/{string.Join(";", coords)}?overview=full&geometries=geojson";
        
        var response = await _httpClient.GetAsync(osrmUrl);
        if (response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            
            var geometryNode = doc.RootElement.GetProperty("routes")[0].GetProperty("geometry");
            var pathCoords = geometryNode.GetProperty("coordinates").EnumerateArray()
                .Select(c => new Coordinate(c[0].GetDouble(), c[1].GetDouble()))
                .ToArray();

            route.Path = new LineString(pathCoords);
            await _repository.UpdateAsync(route);
        }
    }
    
    public async Task InsertStopToRouteAsync(int routeId, StopDto stopDto, int targetOrder, Guid userId, bool isAdmin)
    {
        var route = await _repository.GetByIdAsync(routeId, userId, isAdmin);
        if (route == null) throw new Exception("Güzergah bulunamadı.");

        
        foreach (var s in route.Stops.Where(s => s.Order >= targetOrder))
        {
            s.Order++;
        }

        var newStop = new StopEntity
        {
            Name = stopDto.Name,
            Location = (Point)_wktReader.Read(stopDto.Wkt),
            RouteId = routeId,
            UserId = userId,
            Order = targetOrder 
        };

        route.Stops.Add(newStop);
        await _repository.UpdateAsync(route);
    
        
        await RefreshRoutePathAsync(routeId, userId, isAdmin);
    }

    private RouteDto MapToDto(RouteEntity entity)
    {
        return new RouteDto
        {
            Id = entity.Id,
            Name = entity.Name,
            Color = entity.Color,
            PathWkt = entity.Path != null ? _wktWriter.Write(entity.Path) : null,
            Stops = entity.Stops.Select(s => new StopDto
            {
                Id = s.Id,
                Name = s.Name,
                Order = s.Order,
                Wkt = _wktWriter.Write(s.Location)
            }).ToList()
        };
    }
}