namespace GeoApp.DTOs;

public class PagedResultDto<T>
{
    
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
    
    
    public int TotalCount { get; set; }
}