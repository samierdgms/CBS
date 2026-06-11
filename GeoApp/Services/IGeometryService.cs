using GeoApp.DTOs;

namespace GeoApp.Services;

public interface IGeometryService
{
    
    Task AddGeometryAsync(Guid userId,  GeometryDto dto);
    Task DeleteGeometryAsync(int id, Guid userId, string role);
    Task<GeometryDto?> GetGeometryByIdAsync(int id, Guid userId, string role);
    Task UpdateGeometryAsync(int id, Guid userId, string role, GeometryDto dto);
    Task<IEnumerable<GeometryDto>> GetIntersectionsAsync(int id, Guid userId, string role);
    Task<IEnumerable<GeometryDto>> GetAllGeometriesAsync(Guid userId, string role, Guid? targetUserId = null);
    
    Task<PagedResultDto<GeometryDto>> GetAllGeometriesPagedAsync(
        Guid userId, 
        string role, 
        int page, 
        int pageSize, 
        string? search, 
        string? type, 
        Guid? targetUserId = null);
    
    
    
}