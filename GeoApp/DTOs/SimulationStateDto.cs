namespace GeoApp.DTOs;

public class SimulationLocationDto
{
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int CurrentIndex { get; set; } 
    public bool IsOffRoute { get; set; } 
}