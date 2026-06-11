using System.ComponentModel.DataAnnotations.Schema;

namespace GeoApp.Models;

[Table("AuditLogs")]
public class AuditLogEntity : ISoftDeletable
{
    public int Id { get; set; }
    public string? UserId { get; set; } 
    public string Method { get; set; } = string.Empty; 
    public string Path { get; set; } = string.Empty; 
    public string? QueryString { get; set; } 
    public string? RequestBody { get; set; } 
    public int StatusCode { get; set; } 
    public string? Exception { get; set; } 
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
}