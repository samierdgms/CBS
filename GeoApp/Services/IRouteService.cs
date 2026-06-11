using GeoApp.DTOs;

namespace GeoApp.Services;

public interface IRouteService
{
    
    Task<RouteDto> CreateRouteAsync(RouteDto dto, Guid userId);
    Task<RouteDto?> GetRouteByIdAsync(int id, Guid userId, bool isAdmin);
    Task<IEnumerable<RouteDto>> GetAllRoutesAsync(Guid userId, bool isAdmin);
    
    Task UpdateRouteAsync(int id, RouteDto dto, Guid userId, bool isAdmin);
    Task DeleteRouteAsync(int id, Guid userId, bool isAdmin);
    
    Task AddStopToRouteAsync(int routeId, StopDto stopDto, Guid userId, bool isAdmin);
    Task UpdateStopSortOrderAsync(int routeId, List<int> stopIds, Guid userId, bool isAdmin);
    Task RefreshRoutePathAsync(int routeId, Guid userId, bool isAdmin);
    
    Task InsertStopToRouteAsync(int routeId, StopDto stopDto, int targetOrder, Guid userId, bool isAdmin);
}