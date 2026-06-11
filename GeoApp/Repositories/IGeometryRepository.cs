using GeoApp.Models;
using NetTopologySuite.Geometries;

namespace GeoApp.Repositories;

public interface IGeometryRepository
{
    
    Task<IEnumerable<GeometryEntity>> GetAllByUserIdAsync(Guid userId);
    Task<GeometryEntity?> GetByIdAndUserIdAsync(int id, Guid userId);
    
    
    Task<GeometryEntity?> GetByIdAsync(int id); 
    Task DeleteAsync(int id);
    
    Task AddAsync(GeometryEntity entity);
    Task DeleteForUserAsync(int id, Guid userId);
    Task UpdateAsync(GeometryEntity entity);
    
    
    Task<IEnumerable<GeometryEntity>> GetIntersectsAsync(int id, Guid? userId, Geometry targetGeom);
    
    Task<IEnumerable<GeometryEntity>> GetAllAsync();
    
    Task<(IEnumerable<GeometryEntity> Items, int TotalCount)> GetAllPagedAsync(
        Guid userId, 
        string role, 
        int pageNumber, 
        int pageSize, 
        string? searchTerm, 
        string? type,
        Guid? targetUserId = null);
}