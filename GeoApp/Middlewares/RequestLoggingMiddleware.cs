using System.Security.Claims;
using System.Text;
using GeoApp.Data;
using GeoApp.Models;

namespace GeoApp.Middlewares;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;

    public RequestLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, AppDbContext dbContext)
    {
        
        context.Request.EnableBuffering();

        string requestBodyText = string.Empty;

        
        if (context.Request.ContentLength > 0)
        {
           
            using (var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true))
            {
                requestBodyText = await reader.ReadToEndAsync();
                
                
                context.Request.Body.Position = 0;
            }
        }

        
        if (context.Request.Path.Value != null && 
            context.Request.Path.Value.Contains("/auth/", StringComparison.OrdinalIgnoreCase))
        {
            requestBodyText = "[GÜVENLİK NEDENİYLE MASKELENDİ]";
        }

       
        var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        var auditLog = new AuditLogEntity
        {
            UserId = userId,
            Method = context.Request.Method,
            Path = context.Request.Path,
            QueryString = context.Request.QueryString.ToString(),
            RequestBody = string.IsNullOrWhiteSpace(requestBodyText) ? null : requestBodyText,
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            
            await _next(context);
        }
        catch (Exception ex)
        {
           
            auditLog.Exception = ex.ToString();
            throw; 
        }
        finally
        {
            auditLog.StatusCode = context.Response.StatusCode;

            
            if (string.IsNullOrEmpty(auditLog.UserId))
            {
                auditLog.UserId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            }

            
            dbContext.AuditLogs.Add(auditLog);
            await dbContext.SaveChangesAsync();
        }
    }
}