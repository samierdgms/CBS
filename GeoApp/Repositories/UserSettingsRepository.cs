using GeoApp.Data;
using GeoApp.Models;
using Microsoft.EntityFrameworkCore;

namespace GeoApp.Repositories;

public class UserSettingsRepository : IUserSettingsRepository
{
    private readonly AppDbContext _context;
    public UserSettingsRepository(AppDbContext context) => _context = context;

    public async Task<UserSettingsEntity?> GetSettingsByUserIdAsync(Guid userId) 
        => await _context.UserSettings.FirstOrDefaultAsync(s => s.UserId == userId);

   
    public async Task UpdateSettingsAsync(UserSettingsEntity incomingSettings)
    {
        
        var existingSettings = await _context.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == incomingSettings.UserId);

        if (existingSettings != null)
        {
            
            existingSettings.LastSelectedCountry = incomingSettings.LastSelectedCountry;
            existingSettings.PreferredBaseLayer = incomingSettings.PreferredBaseLayer;
            existingSettings.Theme = incomingSettings.Theme;
            existingSettings.Language = incomingSettings.Language;
        }
        else
        {
            
            await _context.UserSettings.AddAsync(incomingSettings);
        }

        await _context.SaveChangesAsync();
    }
}