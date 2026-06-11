using GeoApp.Models;

namespace GeoApp.Repositories;

public interface IUserSettingsRepository
{
    
    Task<UserSettingsEntity?> GetSettingsByUserIdAsync(Guid userId);
    
   
    Task UpdateSettingsAsync(UserSettingsEntity settings);
}