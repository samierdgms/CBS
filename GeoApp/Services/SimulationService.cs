using System.Collections.Concurrent;
using GeoApp.DTOs;
using GeoApp.Hubs;
using GeoApp.Repositories;
using Microsoft.AspNetCore.SignalR;
using NetTopologySuite.Geometries;
using NetTopologySuite.LinearReferencing;

namespace GeoApp.Services;

public class SimulationService : ISimulationService
{
    private readonly IHubContext<SimulationHub> _hubContext;
    private readonly IRouteRepository _repository;
    
    
    private static readonly ConcurrentDictionary<string, CancellationTokenSource> _activeSimulations = new();

    public SimulationService(IHubContext<SimulationHub> hubContext, IRouteRepository repository)
    {
        _hubContext = hubContext;
        _repository = repository;
    }

    public async Task StartSimulationAsync(int routeId, Point startPoint, string connectionId)
    {
        
        if (_activeSimulations.TryRemove(connectionId, out var oldCts))
        {
            oldCts.Cancel();
            oldCts.Dispose();
        }

        var cts = new CancellationTokenSource();
        _activeSimulations[connectionId] = cts;

        var route = await _repository.GetByIdAsync(routeId, Guid.Empty, true); 
        if (route?.Path == null) return;
        
        var indexedLine = new LengthIndexedLine(route.Path);
        double totalLength = route.Path.Length; 

        
        double interval = 0.001; 
        var resampledCoords = new List<Coordinate>();

        for (double d = 0; d <= totalLength; d += interval)
        {
            resampledCoords.Add(indexedLine.ExtractPoint(d));
        }
        
        
        resampledCoords.Add(indexedLine.ExtractPoint(totalLength));

        
        int startIndex = FindNearestIndex(resampledCoords.ToArray(), startPoint.Coordinate);

        

        _ = Task.Run(async () => 
        {
            try
            {
                
                for (int i = startIndex; i < resampledCoords.Count; i++)
                {
                    if (cts.Token.IsCancellationRequested) break;

                    var currentLocation = new SimulationLocationDto
                    {
                        Latitude = resampledCoords[i].Y,
                        Longitude = resampledCoords[i].X,
                        CurrentIndex = i,
                        IsOffRoute = false
                    };

                    await _hubContext.Clients.Client(connectionId)
                        .SendAsync("ReceiveLocation", currentLocation, cts.Token);
                    
                    await Task.Delay(50, cts.Token); 
                }
            }
            catch (OperationCanceledException) { }
            catch (Exception ex)
            {
                Console.WriteLine($"Simülasyon Hatası: {ex.Message}");
            }
            finally
            {
                _activeSimulations.TryRemove(connectionId, out _);
                cts.Dispose();
            }
        }, cts.Token);
    }

    private int FindNearestIndex(Coordinate[] coords, Coordinate target)
    {
        int nearestIndex = 0;
        double minDistance = double.MaxValue;

        for (int i = 0; i < coords.Length; i++)
        {
            double dist = coords[i].Distance(target);
            if (dist < minDistance)
            {
                minDistance = dist;
                nearestIndex = i;
            }
        }
        return nearestIndex;
    }
    
    public void StopSimulation(string connectionId)
    {
        
        if (_activeSimulations.TryRemove(connectionId, out var cts))
        {
            cts.Cancel(); 
            cts.Dispose(); 
            Console.WriteLine($"[Simülasyon] {connectionId} için durduruldu.");
        }
    }
}