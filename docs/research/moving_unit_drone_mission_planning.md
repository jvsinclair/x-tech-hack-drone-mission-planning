# Research Note: Moving Unit Drone Mission Planning

## Purpose
Map the MVP approach for planning drone coverage around a moving Army unit, including how to identify terrain features that may be obstacles or scout-worthy high ground.

## Status
- Validation status: `provisional`
- Last reviewed: `2026-05-02`
- Owner or agent: `Codex`

## Sources
- `state_planning_for_flight_path_2026_05_02`: Local planning note for squad-leader workflow, ruleset checks, and state-machine conversion.
- `user_clarification_secure_army_unit_2026_05_02`: User clarified the scenario is a simple maneuver to secure an Army unit with drone coverage.
- `user_clarification_pps_drone_commands_2026_05_02`: User confirmed PPS observations should map to drone commands.
- `usgs_3dep`: Candidate U.S. elevation source.
- `opentopography_developers`: Candidate DEM API for clipped terrain data.
- `palantir_map_core_concepts`: Palantir Map supports base, object, link, overlay, annotation, and time-aware layers.
- `palantir_map_add_to_map`: Palantir Map can add geospatial Ontology objects and map overlays.
- `palantir_aip_features`: Palantir AIP can work with Ontology data, logic, and actions through developer tools.
- `maplibre_gl_js`: Candidate map UI layer.
- `deck_gl`: Candidate geospatial overlay and terrain visualization layer.

## MVP Mission Planning Flow
1. Define the unit movement plan:
   - start point, objective point, planned unit route, movement window, and corridor width
   - expected friendly sectors and no-go areas
   - drone profile: endurance, speed band, sensor range, and hold pattern defaults
2. Build the mission corridor:
   - buffer the unit route into a planning corridor
   - divide it into route segments or checkpoints
   - attach expected times to each segment if available
3. Load terrain and map context:
   - use fixture terrain first for demo reliability
   - use USGS 3DEP or OpenTopography only if account/network/time allows
   - optionally enrich with roads, water, structures, or manually drawn obstacles
4. Generate terrain attention points:
   - obstacle candidates: steep slopes, ridges crossing the route corridor, water/structure/road chokepoints, manually marked no-go zones
   - scout candidates: local high points, ridgelines, overlooks near the corridor, and areas with line-of-sight to future route segments
   - coverage gaps: route segments not visible from the current or planned hold pattern
5. Produce drone task options:
   - Route A: stay close to unit and maintain overwatch
   - Route B: push ahead to scout next terrain attention point
   - Hold/loiter: orbit at the current overwatch point
   - RTB: recover route
6. Validate options:
   - route stays outside no-go zones
   - route stays inside configured demo bounds
   - route fits endurance/time assumptions
   - command is valid from current state-machine node
   - cue sector and time window match the expected mission context
7. Execute as a state-machine preview:
   - show route option and rationale
   - require human confirmation for hold, Route A, and Route B
   - make RTB prominent and logged
   - animate the drone path after confirmation

## Terrain Feature Heuristics
Use simple, explainable heuristics for the hackathon demo:
- Steep slope area: flag cells or polygons where slope exceeds a configured demo threshold.
- Ridge crossing: flag elevated terrain features that intersect or closely approach the unit corridor.
- Scout-worthy high point: flag local high points within drone range that overlook upcoming route segments.
- Coverage gap: flag route segments not covered by planned drone sensor radius or approximate line-of-sight.
- Manual obstacle: allow the operator to draw or click no-go/obstacle areas when source data is missing.

These heuristics should be shown as "planning aids" rather than authoritative terrain truth.

## Map UI Shape
- Full-screen map centered on the unit route.
- Unit route as a thick path with checkpoints.
- Drone route options as distinct overlays: Route A, Route B, Hold, RTB.
- Terrain attention points as icons or small polygons:
  - obstacle candidate
  - scout high ground
  - coverage gap
  - no-go zone
- Right panel: selected route rationale, validation warnings, PPS cue mapping, and confirm button.
- Bottom timeline: unit movement segments, cue events, state transitions, and operator confirmations.

## Palantir Use
Yes, use Palantir if team access is ready. The best role is data/ontology/workflow support, not blocking the whole demo on Palantir UI build-out.

Good Palantir fit:
- Model mission objects in an Ontology: unit, drone, route, route segment, waypoint, no-go zone, terrain attention point, cue event, command preview, and state transition.
- Use Palantir Map to view geospatial Ontology objects and reusable overlays.
- Use AIP or Ontology-backed functions to summarize route rationale, retrieve related mission objects, and prepare human-reviewed actions.
- Export or mirror Palantir-backed mission objects into the local MapLibre/deck.gl UI if that is faster for the final demo.

Avoid making Palantir a hard dependency unless a teammate can build there quickly. Fixture-backed local UI should remain the fallback demo path.

## PPS Command Integration
Use `demo_optical_cue_pps_command_mapping_v1`:
- 1 PPS previews hold/loiter
- 2 PPS previews Route A
- 4 PPS previews Route B
- 8 PPS previews or requests RTB

The PPS cue should select between already validated mission branches; it should not generate a brand-new path on its own.

## Recommended Demo Slice
For the one-minute demo:
1. Show a planned unit route and two drone route options.
2. Display terrain attention points along the corridor: one obstacle candidate and one high-ground scout point.
3. Simulate a `4 PPS` cue.
4. UI maps `4 PPS` to Route B, which scouts ahead to the high-ground point.
5. App explains the rationale and validation checks.
6. Operator confirms.
7. Drone path animates and timeline records the state transition.

## Limits
- This is a planning and visualization demo, not an operational drone-control system.
- Terrain heuristics are provisional and should be backed by fixture data for the demo.
- Do not implement kinetic/strike actions, target engagement, real PEQ-15 integration, or autonomous operational drone control.
- Single-source terrain and capability assumptions are acceptable for the hackathon demo when visibly labeled as provisional.

## Follow-Up
1. Create fixture data for a unit route, terrain attention points, no-go zones, and drone route options.
2. Implement a pure function that maps route corridor + terrain fixtures into attention points.
3. Implement a pure function that maps PPS observation + mission state into command preview.
4. Build the MapLibre/deck.gl UI around those fixtures before connecting external terrain sources.
