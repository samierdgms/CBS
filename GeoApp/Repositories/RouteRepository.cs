using GeoApp.Data;
using GeoApp.Models;
using Microsoft.EntityFrameworkCore;

namespace GeoApp.Repositories;

public class RouteRepository : IRouteRepository
{
    private readonly AppDbContext _context;
    public RouteRepository(AppDbContext context) => _context = context;

    public async Task<IEnumerable<RouteEntity>> GetAllAsync(Guid userId, bool isAdmin)
    {
        
        var query = _context.Routes
            .Include(r => r.Stops.OrderBy(s => s.Order))
            .AsQueryable();
    
        
        if (!isAdmin)
            query = query.Where(r => r.UserId == userId);

        return await query.ToListAsync();
    }

    public async Task<RouteEntity?> GetByIdAsync(int id, Guid userId, bool isAdmin)
    {
        var query = _context.Routes
            .Include(r => r.Stops.OrderBy(s => s.Order))
            .AsQueryable();

        
        if (!isAdmin)
            query = query.Where(r => r.UserId == userId);

        return await query.FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task AddAsync(RouteEntity entity)
    {
        
        await _context.Routes.AddAsync(entity);
        await _context.SaveChangesAsync(); 
    }

    public async Task UpdateAsync(RouteEntity entity)
    {
        _context.Routes.Update(entity);
        await _context.SaveChangesAsync();
    }

    
    public async Task DeleteAsync(int id, Guid userId, bool isAdmin)
    {
        
        var entity = await _context.Routes
            .Include(r => r.Stops)
            .FirstOrDefaultAsync(r => r.Id == id && (isAdmin || r.UserId == userId));

        if (entity != null)
        {
            
            foreach (var stop in entity.Stops)
            {
                _context.Stops.Remove(stop);
            }
        
            _context.Routes.Remove(entity); 
            await _context.SaveChangesAsync();
        }
    }

    
    public async Task<IEnumerable<StopEntity>> GetStopsByRouteIdAsync(int routeId, Guid userId, bool isAdmin)
    {
        return await _context.Stops
            .Include(s => s.Route)
            
            .Where(s => s.RouteId == routeId && (isAdmin || s.Route.UserId == userId))
            .OrderBy(s => s.Order)
            .ToListAsync();
    }

    public async Task UpdateStopOrderAsync(List<StopEntity> stops)
    {
        _context.Stops.UpdateRange(stops);
        await _context.SaveChangesAsync();
    }
}