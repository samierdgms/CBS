using Microsoft.EntityFrameworkCore;
using GeoApp.Models;

namespace GeoApp.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<UserEntity> Users { get; set; }
    public DbSet<GeometryEntity> Geometries { get; set; }
    public DbSet<UserSettingsEntity> UserSettings { get; set; }
    public DbSet<RoleEntity> Roles { get; set; }
    public DbSet<PermissionEntity> Permissions { get; set; }
    public DbSet<RolePermission> RolePermissions { get; set; }
    public DbSet<UserPermission> UserPermissions { get; set; }
    
    public DbSet<RouteEntity> Routes { get; set; }
    public DbSet<StopEntity> Stops { get; set; }
    
    public DbSet<AuditLogEntity> AuditLogs { get; set; }

    
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<ISoftDeletable>();

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Deleted)
            {
                
                entry.State = EntityState.Modified;
                
                
                entry.Entity.IsDeleted = true;
                entry.Entity.DeletedAt = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasPostgresExtension("postgis");

        
        modelBuilder.Entity<UserEntity>().HasQueryFilter(u => !u.IsDeleted);
        modelBuilder.Entity<GeometryEntity>().HasQueryFilter(g => !g.IsDeleted);
        modelBuilder.Entity<RoleEntity>().HasQueryFilter(r => !r.IsDeleted);
        modelBuilder.Entity<PermissionEntity>().HasQueryFilter(p => !p.IsDeleted);
        modelBuilder.Entity<UserSettingsEntity>().HasQueryFilter(s => !s.IsDeleted);
        modelBuilder.Entity<RolePermission>().HasQueryFilter(rp => !rp.Permission.IsDeleted);
        modelBuilder.Entity<UserPermission>().HasQueryFilter(up => !up.Permission.IsDeleted);
        modelBuilder.Entity<RouteEntity>().HasQueryFilter(r => !r.IsDeleted);
        modelBuilder.Entity<StopEntity>().HasQueryFilter(s => !s.IsDeleted);
        modelBuilder.Entity<AuditLogEntity>().HasQueryFilter(a => !a.IsDeleted);
        modelBuilder.Entity<RolePermission>()
            .HasKey(rp => new { rp.RoleId, rp.PermissionId });

        modelBuilder.Entity<UserPermission>()
            .HasKey(up => new { up.UserId, up.PermissionId });
        
        

        modelBuilder.Entity<UserEntity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()"); 
            entity.HasIndex(e => e.Email).IsUnique(); 
            entity.HasIndex(e => e.Username).IsUnique();

            entity.HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId);
            
            entity.HasIndex(e => e.Email)
                .IsUnique()
                .HasFilter("\"IsDeleted\" = false"); 

            entity.HasIndex(e => e.Username)
                .IsUnique()
                .HasFilter("\"IsDeleted\" = false");
        });
        
        modelBuilder.Entity<StopEntity>()
            .HasOne(s => s.Route)
            .WithMany(r => r.Stops)
            .HasForeignKey(s => s.RouteId)
            .OnDelete(DeleteBehavior.Cascade);
        
        modelBuilder.Entity<GeometryEntity>()
            .HasOne(g => g.User)
            .WithMany(u => u.Geometries)
            .HasForeignKey(g => g.UserId)
            .OnDelete(DeleteBehavior.Cascade); 

        modelBuilder.Entity<UserSettingsEntity>(entity =>
        {
            entity.HasKey(s => s.UserId); 
            entity.HasOne(s => s.User)
                .WithOne(u => u.Settings)
                .HasForeignKey<UserSettingsEntity>(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        base.OnModelCreating(modelBuilder);
    }
}