namespace GeoApp.Models;

public class UserSettingsEntity : ISoftDeletable
{
    
    public string LastSelectedCountry { get; set; } = "Turkey"; 
    public string PreferredBaseLayer { get; set; } = "OSM";
    public string Theme { get; set; } = "light"; 
    public string Language { get; set; } = "tr"; 
    public Guid UserId { get; set; }
    public UserEntity? User { get; set; } = null!;
    
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }

}