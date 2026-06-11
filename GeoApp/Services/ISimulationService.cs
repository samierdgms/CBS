using NetTopologySuite.Geometries;

namespace GeoApp.Services;

public interface ISimulationService
{
    Task StartSimulationAsync(int routeId, Point startPoint, string connectionId);
    void StopSimulation(string connectionId);
}