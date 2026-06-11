using GeoApp.Data;
using GeoApp.Models;
using Microsoft.EntityFrameworkCore;

namespace GeoApp.Repositories;

public class GeometryRepository : IGeometryRepository
{
    private readonly AppDbContext _context;
    public GeometryRepository(AppDbContext context) => _context = context;

   
    public async Task<IEnumerable<GeometryEntity>> GetAllByUserIdAsync(Guid userId) 
        => await _context.Geometries
            .Include(g => g.User)
            .Where(g => g.UserId == userId)
            .ToListAsync();

    
    public async Task<GeometryEntity?> GetByIdAndUserIdAsync(int id, Guid userId) 
        => await _context.Geometries
            .Include(g => g.User)   
            .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);

    public async Task AddAsync(GeometryEntity entity) 
    { 
        await _context.Geometries.AddAsync(entity); 
        await _context.SaveChangesAsync(); 
    }
    public async Task<GeometryEntity?> GetByIdAsync(int id) 
        => await _context.Geometries
            .Include(g => g.User)
            .FirstOrDefaultAsync(g => g.Id == id);
    
    public async Task DeleteForUserAsync(int id, Guid userId)
    {
        var entity = await _context.Geometries
            .FirstOrDefaultAsync(g => g.Id == id && g.UserId == userId);
            
        if (entity != null) 
        { 
            _context.Geometries.Remove(entity); 
            await _context.SaveChangesAsync(); 
        }
    }

    public async Task UpdateAsync(GeometryEntity entity)
    {
        _context.Geometries.Update(entity);
        await _context.SaveChangesAsync();
    }
    public async Task<IEnumerable<GeometryEntity>> GetIntersectsAsync(int id, Guid? userId, NetTopologySuite.Geometries.Geometry targetGeom)
    {
        var query = _context.Geometries
            .Include(g => g.User)
            .Where(g => g.Id != id && g.Geoloc.Intersects(targetGeom));

        if (userId.HasValue)
        {
            query = query.Where(g => g.UserId == userId.Value);
        }

        return await query.ToListAsync();
    }
    public async Task DeleteAsync(int id)
    {
        var entity = await _context.Geometries.FindAsync(id);
        if (entity != null) 
        { 
            _context.Geometries.Remove(entity); 
            await _context.SaveChangesAsync(); 
        }
    }
    public async Task<IEnumerable<GeometryEntity>> GetAllAsync() 
        => await _context.Geometries.Include(g => g.User).ToListAsync();
    
    public async Task<(IEnumerable<GeometryEntity> Items, int TotalCount)> GetAllPagedAsync(
        Guid userId, string role, int pageNumber, int pageSize, string? searchTerm, string? type, Guid? targetUserId = null)
    {
        var query = _context.Geometries.Include(g => g.User).AsQueryable();

        
        if (role == "Admin")
        {
            
            if (targetUserId.HasValue)
            {
                query = query.Where(g => g.UserId == targetUserId.Value);
            }
        }
        else
        {
            
            query = query.Where(g => g.UserId == userId);
        }

        
        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(g => g.Name.Contains(searchTerm) || (g.Note != null && g.Note.Contains(searchTerm)));
        }

        
        if (!string.IsNullOrEmpty(type))
        {
            query = query.Where(g => g.GeometryType == type);
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(g => g.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }
    
}

