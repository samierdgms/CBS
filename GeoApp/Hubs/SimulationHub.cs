using Microsoft.AspNetCore.SignalR;

namespace GeoApp.Hubs;

public class SimulationHub : Hub
{
   
    public async Task JoinSimulation(int routeId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Route_{routeId}");
    }

    public async Task LeaveSimulation(int routeId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Route_{routeId}");
    }
}