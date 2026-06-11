using GeoApp.DTOs;
using GeoApp.Models;
using GeoApp.Repositories;
using NetTopologySuite.IO;
using GeoApp.Data;
namespace GeoApp.Services;

public class GeometryService : IGeometryService
{
    private readonly IGeometryRepository _repository;
    private readonly WKTReader _wktReader = new();
    private readonly WKTWriter _wktWriter = new();
    private readonly AppDbContext _context;
    
    public GeometryService(IGeometryRepository repository, AppDbContext context)
    {
        _repository = repository;
        _context = context;
    }

    

    public async Task AddGeometryAsync(Guid userId, GeometryDto dto)
    {
        var user = await _context.Users.FindAsync(userId);
        var newGeom = _wktReader.Read(dto.Wkt);
        
        if (user?.Zone != null)
        {
            
            if (!user.Zone.Contains(newGeom))
            {
                throw new Exception("Çizim yetkili olduğunuz bölgenin dışındadır!");
            }
        }
        
        var entity = new GeometryEntity 
        {
            UserId = userId, 
            Name = dto.Name,
            GeometryType = dto.GeometryType,
            Note = dto.Note, 
            Geoloc = _wktReader.Read(dto.Wkt), 
            CreatedAt = DateTime.UtcNow 
        };
        await _repository.AddAsync(entity);
    }

    public async Task DeleteGeometryAsync(int id, Guid userId, string role) 
    {
        if (role == "Admin")
            await _repository.DeleteAsync(id);
        else
            await _repository.DeleteForUserAsync(id, userId);
    }

    public async Task<GeometryDto?> GetGeometryByIdAsync(int id, Guid userId, string role)
    {
        GeometryEntity? entity;
        if (role == "Admin")
            entity = await _repository.GetByIdAsync(id);
        else
            entity = await _repository.GetByIdAndUserIdAsync(id, userId);

        if (entity == null) return null;

        return new GeometryDto {
            Id = entity.Id,
            Name = entity.Name,
            GeometryType = entity.GeometryType,
            Wkt = _wktWriter.Write(entity.Geoloc),
            Note = entity.Note,
            CreatedAt = entity.CreatedAt,
            UpdatedAt = entity.UpdatedAt,
            Username = entity.User?.Username
        };
    }

    public async Task UpdateGeometryAsync(int id, Guid userId, string role, GeometryDto dto)
    {
        var existing = (role == "Admin") 
            ? await _repository.GetByIdAsync(id) 
            : await _repository.GetByIdAndUserIdAsync(id, userId);

        if (existing == null) return;

        var newGeom = _wktReader.Read(dto.Wkt);

        
        if (role != "Admin") 
        {
            var user = await _context.Users.FindAsync(userId);
            if (user?.Zone != null && !user.Zone.Contains(newGeom))
                throw new Exception("Güncelleme yetkili olduğunuz bölgenin dışındadır!");
        }
    
        existing.Name = dto.Name;
        existing.Note = dto.Note; 
        existing.GeometryType = dto.GeometryType;
        existing.Geoloc = newGeom;
        existing.UpdatedAt = DateTime.UtcNow; 

        await _repository.UpdateAsync(existing);
    }

    public async Task<IEnumerable<GeometryDto>> GetIntersectionsAsync(int id, Guid userId, string role)
    {
        
        var mainEntity = (role == "Admin")
            ? await _repository.GetByIdAsync(id)
            : await _repository.GetByIdAndUserIdAsync(id, userId);

        if (mainEntity == null) return Enumerable.Empty<GeometryDto>();

       
        var results = await _repository.GetIntersectsAsync(id, role == "Admin" ? null : userId, mainEntity.Geoloc);

        return results.Select(e => new GeometryDto
        {
            Id = e.Id,
            Name = e.Name,
            GeometryType = e.GeometryType,
            Username = e.User?.Username
        });
    }

    public async Task<IEnumerable<GeometryDto>> GetAllGeometriesAsync(Guid userId, string role, Guid? targetUserId = null)
    {
        IEnumerable<GeometryEntity> entities;

        if (role == "Admin")
        {
            if (targetUserId.HasValue)
            {
                
                entities = await _repository.GetAllByUserIdAsync(targetUserId.Value);
            }
            else
            {
                
                entities = await _repository.GetAllAsync();
            }
        }
        else
        {
            
            entities = await _repository.GetAllByUserIdAsync(userId);
        }

        return entities.Select(e => new GeometryDto 
        {
            Id = e.Id, 
            Name = e.Name, 
            GeometryType = e.GeometryType, 
            Wkt = _wktWriter.Write(e.Geoloc), 
            Note = e.Note, 
            Username = e.User?.Username,
            CreatedAt = e.CreatedAt, 
            UpdatedAt = e.UpdatedAt 
        });
    }
    public async Task<PagedResultDto<GeometryDto>> GetAllGeometriesPagedAsync(
        Guid userId, string role, int page, int pageSize, string? search, string? type, Guid? targetUserId = null)
    {
       
        var (entities, totalCount) = await _repository.GetAllPagedAsync(userId, role, page, pageSize, search, type, targetUserId);

       
        var dtos = entities.Select(e => new GeometryDto 
        {
            Id = e.Id, 
            Name = e.Name, 
            GeometryType = e.GeometryType, 
            Wkt = _wktWriter.Write(e.Geoloc), 
            Note = e.Note, 
            Username = e.User?.Username,
            CreatedAt = e.CreatedAt, 
            UpdatedAt = e.UpdatedAt 
        });

        return new PagedResultDto<GeometryDto> 
        { 
            Items = dtos, 
            TotalCount = totalCount 
        };
    }
}