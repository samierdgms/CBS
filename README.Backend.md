# GeoApp Backend Architecture and Technical Documentation

GeoApp is a full-stack Geographic Information System (GIS) automation platform built on a layered architecture pattern using .NET 8 Web API. The backend core leverages NetTopologySuite (NTS) for handling native spatial geometry validation, operations, and transactional persistence directly inside a PostgreSQL/PostGIS database instance.

---

## 1. Database and Data Access Layer (Persistence)

### AppDbContext.cs
The database context orchestrates spatial extensions, global multi-tenant/data-isolation boundaries, and automated audit triggers:

* **PostGIS Extension Initialization:** Registers the spatial engine using `modelBuilder.HasPostgresExtension("postgis")` to enable R-tree indexing and geometric computations at the database driver layer.
* **Automated Soft Delete Pipeline:** Overrides `SaveChangesAsync` to intercept data mutation life cycles. Any entity implementing `ISoftDeletable` that is flagged for removal is captured by the EF Core Change Tracker, converted into a modified state, and assigned a `true` flag for `IsDeleted` along with a UTC timestamp (`DeletedAt`).
* **Global Query Filtering:** Enforces `HasQueryFilter(e => !e.IsDeleted)` across spatial and administrative tables (`Users`, `Geometries`, `Routes`, `Stops`, `AuditLogs`). This systematically prevents soft-deleted data from inflating result sets or showing up in active application layers without requiring manual LINQ filters.
* **Conditional Unique Indexes:** Implements unique constraint filters via `HasFilter("\"IsDeleted\" = false")` on identity keys like `Email` and `Username`. This enables a dropped account identifier to be immediately re-registered by a new user while preserving historic data integrity.

### Repositories
* **GeometryRepository.cs:** Abstracted repository layer managing core geographic primitives (Points, LineStrings, Polygons).
  * `GetIntersectsAsync` executes native database-level spatial joins via `g.Geoloc.Intersects(targetGeom)` to identify geometric collisions against a spatial index, passing back intersection evaluations directly from the PostGIS engine.
  * `GetAllPagedAsync` processes server-side pagination matrices using flexible query parameters. It evaluates RBAC scope (allowing Admins to review targeted users or the global scope via `targetUserId` while isolating standard profiles to personal data boundaries), matches search criteria against string fields, and filters indices using `GeometryType`.
* **RouteRepository.cs:** Handles transactions regarding networks and stop points.
  * Eager loading techniques are optimized within `GetAllAsync` and `GetByIdAsync` via `.Include(r => r.Stops.OrderBy(s => s.Order))`. This commands the underlying database engine to construct ordered, pre-sorted nested collections over relations to reduce processing overhead during runtime in-memory operations.
  * `DeleteAsync` handles relational cleanups by iterating over and removing associated child records (`Stops`) whenever a parent path entity undergoes a soft delete operation.
* **UserSettingsRepository.cs:** Implements deterministic state synchronization logic (`Upsert`) targeting individual display profiles. It stores spatial visualization basemaps, client locales, themes, and bounding country records.

---

## 2. Business Logic Layer (GIS Engine & Authentication)

### RouteService.cs
Coordinates multi-stop path networks by binding geographic point data to real-world infrastructure systems.

* **Dynamic Array Re-indexing (`UpdateStopSortOrderAsync`):** Receives primitive collections reflecting updated client-side display lists, maps index properties to incremental counters, applies sequential ordering indexes, updates the target sequence via `UpdateStopOrderAsync`, and forces a path recalculation.
* **Intermediary Node Injection (`InsertStopToRouteAsync`):** Performs shifting calculations whenever a marker is added midway into a route. It auto-increments ordering values for every downstream stop (`s.Order++`) to establish a vacancy at the target index before executing child operations.
* **OSRM Routing Engine Integration (`RefreshRoutePathAsync`):** Transforms localized sequence markers into formatted string coordinate records. It communicates with an external native **OSRM (Open Source Routing Machine)** instance over an HTTP channel, parses the resultant GeoJSON coordinate matrix, and instantiates an updated NetTopologySuite `LineString` to map the updated road trajectory.

### SimulationService.cs
Manages low-latency real-time spatial physics and state calculations using an asynchronous execution paradigm.

* **Spatial Path Interpolation:** Raw route vectors derived from external mapping services can produce irregular intervals that distort continuous visual animation tracking. The service initializes an NTS `LengthIndexedLine` tracking matrix over the `Path` geometry, determines total geographic lengths, and executes iterative sampling intervals (`0.001` step size) to generate high-density, equidistantly spaced step arrays.
* **Coordinate Synchronization (`FindNearestIndex`):** Accepts remote point definitions submitted as origin inputs and resolves spatial entry vectors by matching target properties across the pre-calculated step matrix using `Distance()` checks to pinpoint the closest starting node.
* **Concurrency and Thread State Cancellation:** Leverages a `ConcurrentDictionary` to anchor operational scopes directly to unique client connection identifiers (`connectionId`). When an active channel re-submits a simulation request, the service extracts the previous execution frame, issues an immediate `Cancel()` down the corresponding `CancellationTokenSource` path, disposes of the obsolete context, and provisions an isolated workspace using a clean asynchronous thread wrapper.

### AuthService.cs
Maintains cryptographic identities and role properties across individual sessions.

* **Secure Identity Provisioning (`RegisterAsync`):** Processes registration inputs by routeing plaintext variables into a 12-round BCrypt encryption module to yield a secure `PasswordHash`. It wires up assigned security schemas (defaulting to standard "User" scopes when none are passed) and seeds dependent records like default `UserSettingsEntity` states inside a single transactional block.
* **Session Claims Signing (`GenerateJwtToken`):** Validates credentials and serializes key metadata fields (`Id`, `Email`, `Username`, `Role`) into an encrypted payload signed with an `HmacSha256` key blueprint.
* **Lifecycle Identity Recovery (`ForgotPassword` / `ResetPassword`):** Generates securely randomized 32-byte hexadecimal strings, commits token hashes directly to corresponding profiles with a 64-minute expiration window, and routees text components to users using a `MailKit` SMTP client layer.

### GeometryService.cs
Acts as an internal spatial validation boundary to enforce spatial rules across incoming data models.

* **Spatial Fence Validation (`Contains`):** Serves as an institutional security barrier guarding physical databases against invalid geofence entry records. During geometry addition or updating workflows, the system extracts the explicit spatial boundary configuration (`Zone`) assigned to the active user profile. It runs a spatial evaluation via `user.Zone.Contains(newGeom)`. If any point or section of the target drawing falls outside the coordinates of the assigned zone, the execution loop is aborted, throwing a spatial violation exception.

---

## 3. Middleware and API Controller Layers

### RequestLoggingMiddleware.cs
An HTTP pipeline inspector engineered to run real-time auditing and exception capturing across active application channels.

* **Input Stream Buffering (`EnableBuffering`):** Modifies standard input streams by caching request buffers inside accessible, reusable temporary storage spaces. This enables the auditing engine to read, inspect, and evaluate raw inbound text data strings before shifting the stream position tracker back to zero (`Position = 0`), which leaves the payload completely intact for standard controller ingestion pipelines.
* **Identity Protection Muting:** Evaluates inbound paths to protect sensitive operations. If an incoming request path points toward `/auth/` routes, the logging engine intercepts the body parameter string and overrides the telemetry records with a generic placeholder string: `[***]`. This prevents plaintext passwords from leaking into system logs.
* **Exception Logging Framework:** Encapsulates downstream tasks in an exhaustive `try-catch-finally` block. If system crashes occur, the component captures the stack trace details, maps active variables (`UserId`, `Method`, `Path`, `QueryString`, `StatusCode`), and commits the structural payload down into the long-term `AuditLogs` store.

### SimulationHub.cs
An ASP.NET Core **SignalR** hub optimized to coordinate downstream telemetry broadcast channels.

* **Targeted Channel Grouping:** Implements room isolation concepts via `Groups.AddToGroupAsync` and `Groups.RemoveFromGroupAsync`. Rather than broadcasting massive telemetry payloads across the entire connected network, the infrastructure creates unique message paths named after explicit paths (`Route_{routeId}`). Telemetry payloads are routeed only to client devices currently listening inside that specific channel group.

### Controllers
* **AdminController.cs:** Restricted via `[Authorize(Roles = "Admin")]`. Provides administration features including modification of authorization properties, access to structured server-side logs via `GetLogsPaged`, log purge utilities, and role configuration mappings.
* **RoutesController.cs:** Handles lifecycle events for application routing profiles, providing programmatic entry points to append nodes, shift stop indexes, drop specific stops, and invoke OSRM calculations.
* **SimulationController.cs:** Serves as a gateway for live animation orchestration by transforming inbound parameters into atomic triggers passed down into the asynchronous background loop engine.
* **GeometriesController.cs:** Exposes transactional paths for CRUD operations on geometric features, page indexing requests, and spatial intersect computations.
