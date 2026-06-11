using GeoApp.Models;

namespace GeoApp.Repositories;

public interface IRouteRepository
{
    
    Task<IEnumerable<RouteEntity>> GetAllAsync(Guid userId, bool isAdmin);
    Task<RouteEntity?> GetByIdAsync(int id, Guid userId, bool isAdmin);
    
   
    Task AddAsync(RouteEntity entity);
    Task UpdateAsync(RouteEntity entity);
    
    
    Task DeleteAsync(int id, Guid userId, bool isAdmin);

    
    Task<IEnumerable<StopEntity>> GetStopsByRouteIdAsync(int routeId, Guid userId, bool isAdmin);
    Task UpdateStopOrderAsync(List<StopEntity> stops);
}