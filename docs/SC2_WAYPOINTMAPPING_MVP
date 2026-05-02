**StarCraft 2 (SC2) waypoint-based movement**, explained in **MVP (Minimum Viable Product) terms** for real-world drone/UAV movement and mapping.

### 1. Player-Facing Waypoint System (the simple, controllable layer)
In SC2 you don't just click "go here." You **queue a chain of waypoints**:

- Select unit(s) (e.g., a drone).
- Hold **Shift** + right-click (or Attack-move, Patrol) on successive points on the map or minimap.
- The unit follows the exact sequence: Point A → B → C → D.

This is perfect for **drone tasks**:
- Scouting/mapping the map without babysitting.
- Safe routes around enemy vision or terrain.
- "Lawnmower" patterns for area coverage.

**MVP takeaway for real drones**:  
Your ground station / app only needs a **list of ordered GPS coordinates** (or local coordinates). The drone flies them sequentially. No fancy AI needed yet — just "follow this list."

### 2. Engine-Level Movement (what actually happens under the hood in SC2)
SC2's pathfinding is famous for feeling smooth even with hundreds of units. It splits into two clean layers (this is the part worth stealing for an MVP drone system):

| Layer | SC2 Implementation | Why it works great for drones |
|-------|--------------------|-------------------------------|
| **Global Planner** (rarely recomputes) | Dynamic **navmesh** via Constrained Delaunay Triangulation (CDT) of static obstacles (terrain, buildings). Then **A*** on triangles → **Simple Stupid Funnel** algorithm smooths it down to the *fewest* straight-line waypoints. | Gives optimal, low-waypoint paths that hug walls safely. Fast and predictable. |
| **Local Steering** (runs every frame) | **Boids-style steering** (separation, alignment, cohesion) + collision avoidance. Units treat each other as soft obstacles. No constant full re-pathing. | Handles crowds, dynamic obstacles, and swarm behavior without exploding CPU. |

**Key insight**: Units get a **short list of waypoints** from the planner, then locally "steer" toward the next one while dodging stuff in real time.

### 3. MVP Architecture for Real Drone Movement + Mapping
Here's the **minimal viable** system you can build (or prototype in a weekend) that mirrors SC2:

1. **Map / World Representation** (the "navmesh" equivalent)  
   - Start with an **occupancy grid** (2D array or OctoMap) built from drone sensors (camera + depth, LiDAR, or even cheap IMU + visual SLAM).  
   - Mark cells: free / occupied / unknown.  
   - Update incrementally as the drone flies (online mapping).

2. **Waypoint Queue** (exactly like Shift + click)  
   - User (or high-level planner) pushes a list of target positions.  
   - Example for mapping: generate a coverage pattern (lawnmower / boustrophedon / spiral) → turn it into ordered waypoints.

3. **Global Planner (MVP version)**  
   - Run **A*** (or Jump Point Search for speed) on the grid from current position to next user waypoint.  
   - Apply **funnel/string-pulling** (or just post-process with line-of-sight smoothing) to reduce the path to 3–8 waypoints.  
   - Only replan if the map changes significantly or you hit a blockage.

4. **Local Controller (the "steering" layer)**  
   - PID velocity controller or pure pursuit to chase the next waypoint.  
   - Add simple reactive avoidance: potential fields, DWA (Dynamic Window Approach), or basic boids rules if you have a swarm.  
   - Safety: geofence + emergency stop if obstacle too close.

5. **Drone-Specific Extras (Zerg-drone flavor)**  
   - **Mineral-walking style**: When "gathering" data at a waypoint, ignore minor collisions or slow down gracefully.  
   - **Rally behavior**: New drones can be sent to a shared rally waypoint (like hatchery rally).  
   - **Mapping mode**: At each waypoint, pause/rotate/gimbal camera, capture images, update occupancy grid, then proceed.

### Pseudo-code MVP (Python-style, works on real drones via ROS2 or DroneKit)
```python
class DroneNavigator:
    def __init__(self):
        self.map = OccupancyGrid()          # updated from sensors
        self.waypoint_queue = []            # list of (lat, lon) or (x,y,z)
        self.current_path = []              # smoothed waypoints from planner

    def set_mapping_route(self, coverage_waypoints):
        self.waypoint_queue = coverage_waypoints  # e.g., lawnmower pattern

    def update(self):
        if not self.current_path:
            if self.waypoint_queue:
                target = self.waypoint_queue.pop(0)
                self.current_path = a_star_with_funnel(self.map, current_pos, target)
        
        if self.current_path:
            next_wp = self.current_path[0]
            cmd_vel = pid_pure_pursuit(next_wp) + avoidance_force()
            send_velocity_command(cmd_vel)
            
            if reached(next_wp):
                self.current_path.pop(0)
                # take mapping data here
```

This is literally SC2's philosophy in minimal form:  
**Player (or high-level commander) sets waypoints → smart engine turns them into smooth, safe flight.**

### Why this is "MVP-appropriate" for drones
- **Minimal compute**: Global planner runs rarely; local steering is cheap.
- **Robust to dynamics**: Map updates + steering handle moving obstacles/people/other drones.
- **Scalable to swarm**: Add boids separation and you get natural flocking like SC2 armies.
- **Mapping-ready**: Waypoints naturally support coverage paths; online map updates let you re-plan on the fly.

If you want the next steps (actual navmesh code, ROS2 example, lawnmower pattern generator, or how to handle Zerg-style "drone morphing" into stationary mapping stations), just say the word. This is the cleanest, most SC2-faithful starting point for real drone waypoint navigation and autonomous mapping.
