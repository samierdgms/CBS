# GeoApp - Frontend Architecture and Detailed Technical Documentation

GeoApp Frontend is an enterprise-grade Single-Page Application (SPA) built on **React (Vite)** that consolidates map-based spatial data production, topological validation interfaces, dynamic route optimization, and real-time vehicle simulation tracking into a unified GIS ecosystem.

The system utilizes **OpenLayers** as its primary map rendering engine while leveraging the **PrimeReact** and **PrimeFlex** ecosystems for user interface elements and reactive data components.

---

## 🚀 Key Features & Advanced GIS Capabilities

### 1. Advanced Map, GeoServer, and Layer Management (OpenLayers)
* **GeoServer WMS Integration:** To achieve high performance without bloating browser memory when rendering millions of spatial records from PostGIS tables, the application integrates GeoServer `TileWMS` (`ol/source/TileWMS`). Layer visibility toggles within `Navbar.jsx` and `RouteLegend.jsx` allow users to dynamically switch geospatial server layers on and off.
* **Spatial Styling & Dynamic WMS Refresh:** Cartographic styles defined via **SLD (Styled Layer Descriptor)** on GeoServer dynamically update on the map when changes occur. Modifying route colors or layer attributes inside `RouteManager.jsx` commits updates to the database and immediately invokes `refreshWmsLayer()`, rendering the updated presentation instantly on the client side.
* **Spatial Drawing Interactions:** Using `ol/interaction/Draw`, users can natively draft Point, LineString, and Polygon geometries directly mapped to the map's native projection (EPSG:3857). Upon drawing completion, geometry vectors are parsed into **WKT (Well-Known Text)** format before being persisted to the backend PostGIS database.
* **Vertex Snapping Support:** Integrated via `ol/interaction/Snap`, the cursor automatically locks onto the closest vertex or edge when a user creates new stops or edits existing features. This safeguards data integrity, systematically eliminating topological gaps and unintended overlaps.

### 2. PostGIS Spatial Intersect & Attribute Profiling
* **Real-Time Spatial Intersect Detection (Spatial Join):** While a selected feature's attributes are displayed inside `FeaturePopup.jsx`, spatial join results fetched via the backend's PostGIS-driven `GetIntersectsAsync` algorithm are listed simultaneously. All overlapping or intersecting geometries (`intersectingFeatures`) are populated inside the popup container alongside their creator's username and geometry type.
* **Dynamic Geometrical Focus (Pan/Zoom):** Clicking on any item from the intersection list or the centralized inventory table triggers a `focusOnFeature` routine, seamlessly panning and zooming the viewport bounds to center around the targeted coordinate matrix.
* **Cartographic Measurement Metrics:** Depending on the active geometry type (metric length for LineString paths, square meters for Polygon boundaries), the `formatShapeMeasurement` helper calculates real-time spatial dimensions directly inside the feature popup display.

### 3. Server-Side Paginated (Lazy Paged) Inventory Management
* **Performance-Driven Lazy Pagination:** To minimize client-side computation, the PrimeReact `DataTable` element in `InventoryTable.jsx` adheres to a strict **Server-Side Pagination (Lazy Loading)** architecture. Page navigation updates (`onPage`) or adjustments to the row count transmit only the active boundary matrices (`page`, `pageSize`) to the `/geometries/paged` endpoint, retrieving isolated database slices.
* **Concurrent Text Search Filtering:** The inventory table's filtering hook (`onSearchChange`) binds string inputs directly into the query parameters (`search`). This executes indexed, server-side `LIKE` operations across name and note fields, re-rendering data streams responsively.

### 4. Live Simulation Panel & Real-Time Telemetry
* **SignalR Hub Communication:** Managed through `SimulationControl.jsx`, the live asset-tracking workspace relies on an active ASP.NET Core SignalR WebSocket connection. Client nodes dynamically join isolated execution rooms (`Route_{routeId}`) specified by the chosen route context.
* **Asynchronous Interpolation & Smooth Animations:** High-density waypoint coordinate arrays generated via the backend `SimulationService` (using a `0.001` step size) stream directly to the frontend over SignalR. The OpenLayers engine processes incoming telemetric vectors asynchronously, rendering fluid, jitter-free marker navigation (`ol/geom/Point`) along the calculated path trajectory.
* **Location Selection & State Machine:** The simulation interface implements a robust three-stage finite state machine:
  * `selecting`: The user picks an anchor point on the map to initialize the simulation timeline.
  * `ready`: The chosen coordinates are processed via the backend's `FindNearestIndex` routine, arming the animation pipeline.
  * `running`: The live telemetry loop executes, driving marker movement while control prompts transition to "Stop" modes.

### 5. Dynamic Route & Stop Management
* **Drag-and-Drop Reordering:** Utilizing PrimeReact's `OrderList` inside `RouteManager.jsx`, users can adjust stop sequences via drag-and-drop actions. Altering the structural array triggers the client-side `reorderStops` API hook. The backend updates the relational database `Order` indices, forcing the local Open Source Routing Machine (OSRM) engine to re-compute the optimal path trajectory (`LineString`).
* **Inline Stop Editor:** Leveraging the PrimeReact `Inplace` utility, users can rename stop identifiers via double-click interactions without closing modals. Modifications sync to the database on `blur` or `Enter` keystrokes.

### 6. Thematic Analysis Module
* **Vector Analytic Injections:** Managed through `ThematicModal.jsx`, this tool allows users to visualize spatial data density. Available analytical treatments filter dynamically based on the target layer's base geometry:
  * **Point:** *Heatmap Analysis* for density distribution or *Cluster Analysis* for aggregating nearby point groupings.
  * **LineString:** *Length Analysis* adjusting line weights or colors based on custom metric attributes.
  * **Polygon:** *Choropleth Analysis* rendering shades based on surface area dimensions or density ratios.

### 7. Corporate Authentication & Security Lifecycle
* **Comprehensive Auth Flows (`Auth.jsx`):** Login, Register, Forgot Password, and Reset Password states are bound to a unified reactive workflow featuring smooth container transitions. Sensitive parameters are systematically masked across communication channels.
* **Token Countdown Tracker:** Upon successful authentication, the system decodes the incoming JWT token's `exp` (expiration) claim. `TokenCountdown.jsx` tracks remaining session validity second by second. As the token nears expiration, the display adapts color profiles (`info` -> `warning` -> `danger`) before executing an automated `handleLogout` sequence to clear local storage tokens.

### 8. Advanced Admin Control Panel & Role-Based Access Control (RBAC)
* **Role and Permission Matrices:** Administrators can modify system roles dynamically via the administrative interface. Assigned page or button-level access permissions (`userPermissions`) adjust at runtime, filtering visible options on `Navbar.jsx` according to active privilege clearings.
* **Spatial Boundary Allocation (`ZonePicker.jsx`):** Administrators can assign spatial boundaries (Geofences) to user accounts by drafting polygons on an isolated map canvas. This output directly drives the backend `GeometryService.cs` `Contains` evaluation barrier. Users attempting to submit features outside their assigned boundaries encounter spatial exception errors.
* **Advanced Logging & Audit Inspector:** Direct HTTP transaction metrics, system fault lines, and trace logs captured via the backend `RequestLoggingMiddleware` surface here. JSON payload structures format as readable code blocks, while plaintext credentials remain masked via standard `[***]` anonymization rules.

---

## 📁 Directory Structure and Component Map

```text
src/
├── api/
│   ├── api.js               # Central Axios client setup & 401 unauthorized interceptor logic
│   └── routeApi.js          # Specialized HTTP hooks for route modification, re-ordering, and OSRM execution
├── components/
│   ├── EditToolbar.jsx      # Sticky modify navbar rendered while translating feature coordinates by hand
│   ├── FeaturePopup.jsx     # Spatial attribute sheet displaying PostGIS metadata and overlap records
│   ├── InventoryTable.jsx   # Paginated, server-side (Lazy) search matrix for GIS inventory queries
│   ├── Navbar.jsx           # Master navigation bar controlling tools, snapping, layer toggle, language, and theme
│   ├── RouteLegend.jsx      # Overlay tracking route colors, rendering toggles, and edit state flags
│   ├── RouteManager.jsx     # Modal panel coordinating route compilation, indexing (OrderList), and path modifications
│   ├── SimulationControl.jsx# Real-time state tracker (start/stop/target) piloting the live telemetry engine
│   ├── ThematicModal.jsx    # Thematic analytics router configuring Heatmaps, Clusters, or Choropleth styles
│   ├── TokenCountdown.jsx   # Chronometer auditing JWT token duration and handling automated logouts
│   ├── UIExtras.jsx         # Global configuration shortcuts (AutoComplete, ConfirmDialog, etc.)
│   └── ZonePicker.jsx       # Geofencing sandbox map interface used to manage user boundary allocations
├── constants/
│   └── constants.js         # Dictionary handling dual-language (TR/EN) sets, error profiles, and fallbacks
├── pages/
│   ├── AdminPanel.jsx       # Dashboard containing RBAC controls, Geofence tooling, and raw system log feeds
│   └── Profile.jsx          # Individual profile panel managing preferences, theme settings, and password updates
├── App.jsx                  # Root coordination engine initializing OpenLayers maps and core application state hooks
├── main.jsx                 # Entry execution pipeline setting third-party CSS imports and PrimeReact roots
└── App.css                  # Style rules defining Light/Dark palettes via CSS variables and responsive grids
