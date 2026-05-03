# Palantir Rebuild Master PRD And Design Prompt

## Purpose

This document is the single prompt-ready product and design specification for rebuilding the drone surveillance planner in Palantir Foundry/AIP as a backup to the local Vite/Cesium app.

It supersedes the earlier route-branch preview framing. The corrected product direction is a DroneDeploy-like field planning tool for Army units that pre-plan surveillance launch packages moving with a ground unit. In the hackathon MVP, launch, flight progress, PEQ detection, PPS interpretation, and route state changes are all simulated.

Use this as a master PRD, ontology brief, Workshop/app prompt, implementation checklist, and source of truth for Palantir rebuild work.

Status: `provisional`, prompt-ready, last updated `2026-05-03`.

---

## Paste-Ready Palantir Prompt

Build a Palantir-backed drone surveillance planning workspace for a synthetic Sunol / Pleasanton Ridge training scenario. The tool should feel like a field-oriented DroneDeploy-style mission planner for Army units: operators create reusable surveillance launch packages that move with a ground unit, tie those packages to checkpoints or decision points, and simulate launching the package when the unit reaches the right place.

The hackathon MVP must be simulation-only. It must not control real drones, upload autopilot commands, connect to PEQ-15 hardware, or imply operational command and control. The long-term product direction can describe field use, but the implemented demo is a local/Palantir simulation with explicit audit logs and warnings.

The first screen must be the usable planner, not a landing page. Use a full-screen operational map with a compact dark operator UI: top toolbar, map view controls, right-side planner rail, bottom status bar, and map legend. The product has two primary workflows:

1. **Plan Mission:** Create or edit surveillance launch packages. Operators add ordered waypoints, configure surveillance behaviors, place decision points, attach primary and alternate route branches, and place decision target zones that represent where a simulated PEQ/PPS pulse can be aimed.
2. **Launch Package Simulation:** Start simulated playback from the package launch point. The simulation auto-plays through route states, offers manual step and jump controls, pauses at decision points, and lets the operator simulate a PPS pulse against one of the placed decision target zones.

Use Palantir as the structured data, ontology, map, action, and API surface. Ingest the existing Sunol upload bundle files if available, parse them into object types or datasets, preserve provenance fields, and expose read/action functions for the app. Do not stop at flat file storage. Create mission objects, relationships, geospatial layers, simulation state, and audit actions that can replace the local app data provider.

Safety scope is mandatory:

- Surveillance/overwatch planning and simulation only.
- No strike, engage, kinetic action, target selection, weapon release, real drone control, MAVLINK/GCS export, hardware control, covert signaling protocol design, or autonomous operational command.
- PEQ-15/PPS behavior in the MVP is simulated only.
- Public-source terrain, infrastructure, and route context are provisional planning aids, not certified operational truth.

Core data model: Mission, AreaOfInterest, UnitRoute, Checkpoint, DroneProfile, LaunchPackage, LaunchSimulation, DroneWaypoint, RouteSegment, DecisionPoint, DecisionTargetZone, PrimaryRouteBranch, AlternateRouteBranch, HoldBranch, LandBranch, PulseCueEvent, MissionStateNode, MissionStateTransition, AuditLogEvent, TerrainAttentionPoint, NoGoZone, TacticalUnit, InfrastructureFeature, RoadOrPath, Building, NaturalFeature, SourceManifest, ValidationWarning, and Observation.

Store all geometry as WGS84 GeoJSON or Palantir geospatial object geometry. Display Lat/Lon and MGRS for map objects, waypoints, decision target zones, and selected simulation state. Preserve `source_name`, `source_url`, `retrieved_at`, `provisional`, `layer_id`, and `evidence_refs` wherever present.

Implement the simulation PPS grammar exactly:

- `1 PPS` = Hold / loiter.
- `2 PPS` = Land / recover.
- `4 PPS` = Primary route.
- `8 PPS` = Alternate route.
- Unsupported, outside-zone, stale, invalid-state, or ambiguous cue = no route state change; log a warning.

At a decision point, the simulation must pause. The operator selects or highlights a placed decision target zone and simulates a PPS value aimed at that zone. If the event is valid for the active decision point and zone, the simulation applies the resulting branch/action immediately in simulation and writes an audit log. Valid 4 PPS selects the primary route. Valid 8 PPS selects the alternate route. Valid 1 PPS holds/loiters. Valid 2 PPS routes to Land/recover. Do not require an extra confirmation click after a valid PPS event in the simulation.

Map and symbology contract:

- AOI boundary visible first.
- Ground unit route/checkpoints: muted non-yellow friendly context stroke.
- Surveillance launch package route: yellow only.
- Untread/not-yet-simulated drone route: dotted yellow at about 50% opacity.
- Simulated or committed route behind current playback state: solid yellow at about 50% opacity.
- Primary and alternate route branches: yellow route grammar, with clear labels and active-branch highlight during simulation.
- Decision target zones: terrain-clamped circles/polygons with PPS and decision labels; distinguish them from generic context/cue zones.
- Active decision point: strong but non-yellow focus halo.
- Camera/FOV: light blue wedges, rays, or pan arcs.
- Scan/surveillance footprint: non-yellow polygons/corridors/ribbons, visually distinct from route centerline.
- No-go/review zones: red/caution hatch or fill, never route yellow.
- Power, roads, buildings, vegetation, waterways, and barriers: quiet context layers.
- Terrain attention points: icons or pins by type, with rationale and provenance.
- MIL-STD-2525D land unit symbols: support squad-level land units, all four affiliations, 30-character SIDC, SVG rendering, labels, and top z-order above waypoints and basemap.

UI visual style: dark map-first operator shell. Use `#101312` / deep green-black backgrounds, `#eef1eb` primary text, `#aeb8ad` muted text, amber `#ffd166` controls, route yellow `#fbbf24`, teal `#6de0d2`, camera blue `#7ee7ff`, scan purple `#a78bfa`, no-go red `#ff5c5c`, power orange `#ff8f3d`, friendly route green `#8ec07c`, and preview/attention pale yellow `#fff1a8`. Use compact 8px-radius translucent panels with readable labels and no decorative marketing chrome.

Launch Simulation panel requirements:

- Play/Pause auto playback.
- Next Step and Previous Step controls.
- Jump to Decision control.
- Current state label.
- Elapsed simulated time.
- Active waypoint or route segment.
- Active decision point, if paused.
- Placed decision target zones for the active decision.
- PPS buttons for 1, 2, 4, and 8 PPS.
- Selected target zone.
- Validation result.
- Selected branch/action.
- Audit log.

Plan Mission requirements:

- Create mission from empty or loaded baseline.
- Add or confirm launch point.
- Click map to add ordered surveillance waypoints.
- Maintain multiple named launch packages.
- Pick waypoint behavior before placement from a marker palette.
- Select a waypoint, segment, decision point, target zone, tactical unit, terrain point, or branch and show detail panel.
- Configure waypoint objective, surveillance action, dwell/scan parameters, decision triggers, timeout behavior, primary branch, alternate branch, hold behavior, Land behavior, and target zones.
- Recompile on every edit: route distance, simulated timeline, warnings, state graph, branch attachments, and Palantir action/API payloads.

Waypoint behavior catalog:

- Launch: simulated package start.
- Transit: move between planned points without collection emphasis.
- Scout: move or orbit to inspect ahead of the ground unit.
- Scan area: collect over an area/corridor.
- Observe: hold sensor attention on a point/zone.
- Hold/loiter: wait at a planned hold point; selected by 1 PPS at a decision point.
- Decision point: simulation pause state where PPS target-zone events are evaluated.
- Land/recover: simulated recovery path; selected by 2 PPS.
- Land/recover: terminal simulated recovery.
- Abort/emergency: stop simulated progression and require acknowledgement.

Palantir APIs/functions/actions to expose:

- Reads: `getMissionBundle`, `getAoi`, `getMapContextLayers`, `getInfrastructureContext`, `getTerrainAttentionPoints`, `getMissionRoute`, `getLaunchPackages`, `getLaunchSimulation`, `getRouteBranches`, `getDecisionTargetZones`, `getNoGoZones`, `getSourceManifest`, `getMissionStateGraph`, `getAuditLog`.
- Planning actions: `createLaunchPackage`, `updateLaunchPackage`, `addDroneWaypoint`, `updateDroneWaypoint`, `deleteDroneWaypoint`, `updateRouteSegment`, `addDecisionPoint`, `addDecisionTargetZone`, `attachPrimaryRouteBranch`, `attachAlternateRouteBranch`, `attachHoldBranch`, `attachLandBranch`, `addNoGoZone`, `placeTacticalUnit`, `updateTacticalUnit`, `compileLaunchPackage`.
- Simulation actions: `startLaunchSimulation`, `pauseLaunchSimulation`, `resumeLaunchSimulation`, `stepLaunchSimulation`, `jumpLaunchSimulationToState`, `simulateDecisionZoneCue`, `selectSimulationBranch`, `appendAuditLogEvent`.
- All read responses must use JSON/GeoJSON, WGS84 geometry, provenance, validation status, and warning arrays.
- All actions must append or reference an audit event and return updated simulation state, changed object ids, validation warnings, and selected branch/action where applicable.

Acceptance test: A judge can load the Sunol mission, see AOI and context layers, create a surveillance launch package along a ground unit route, add surveillance waypoints, place a decision point and target zone, start simulated launch playback, watch playback auto-advance and pause at the decision point, select a target zone, simulate `4 PPS`, see the primary route selected and logged, repeat with `8 PPS` for the alternate route, and see cue rejection logged when a PPS event is outside the active target zone.

---

## 1. Product Summary

### Problem

Army units need a field-planning tool for drone surveillance missions that can move with a ground unit and be prepared before the unit reaches a checkpoint or decision location. The tool should let operators build surveillance route packages, rehearse them, and simulate low/no-radio branch selection through PEQ/PPS cues aimed at pre-placed target zones.

### One-Sentence Product

A Palantir-backed surveillance launch-package planner where operators create waypoint-based drone overwatch routes for moving units, simulate launch playback, and use simulated PEQ/PPS pulses at decision target zones to select hold, Land/recover, primary, or alternate route behavior.

### MVP Promise

The MVP is not a static map import. It is an interactive simulation workflow:

1. Load mission context and map layers.
2. Author a surveillance launch package along a ground unit route.
3. Add waypoints, decision points, primary/alternate branches, and decision target zones.
4. Compile the package into a state graph and simulated timeline.
5. Start simulated launch playback.
6. Auto-play route progress and pause at decision points.
7. Simulate PPS against a selected target zone.
8. Apply valid simulated branch/action changes and preserve audit logs, rationale, provenance, and warnings.

### Users

- Squad leader planning surveillance support for movement.
- Drone operator rehearsing launch-package behavior.
- Judge/observer evaluating the end-to-end simulation workflow.
- Engineer/analyst building Palantir objects, functions, actions, and map layers.

---

## 2. Scope And Safety Guardrails

### In Scope

- Surveillance/overwatch route planning for a moving ground unit.
- Synthetic training scenario and public-source map context.
- Waypoint-based surveillance launch-package authoring.
- Simulated launch playback with auto-play, pause, step, and jump controls.
- Decision points and placed decision target zones.
- Simulated PEQ/PPS branch selection.
- Hold/loiter, scout, scan, observe, primary route, alternate route, Land/recover, and abort/emergency states.
- Terrain attention points and route altitude planning.
- Source provenance, validation warnings, and audit logs.
- Natural-language summaries or questions with citations to mission objects.

### Future Scope

- Mapping/lawnmower collection missions similar to DroneDeploy.
- Live data feeds.
- Real PEQ/hardware integration after separate safety, legal, and operational review.
- Real drone execution or export only after separate explicit authorization.

### Out Of Scope For Hackathon MVP

- Real drone command and control.
- MAVLINK/GCS export or autopilot upload.
- Hardware integration.
- Real PEQ-15 signal detection.
- Covert signaling protocol design.
- Strike, engage, kinetic action, target selection, weapon release, or autonomous engagement.
- Treating public-source terrain as certified clearance.
- Treating PPS as authentication/IFF.

### Safety Copy To Use In The UI

- "Simulated launch package only."
- "No drone command sent."
- "PPS event is simulated, not hardware input."
- "Decision target zones are planning/simulation geometry."
- "Terrain and infrastructure are provisional planning context."

---

## 3. Scenario And Data Package

### Scenario

- Name: `Sunol Ridge Training Area`
- Context: synthetic route-security / scout-ahead surveillance mission around Sunol / Pleasanton Ridge.
- Purpose: support a moving Army unit with drone overwatch, terrain context, checkpoint decisions, and primary/alternate route selection.
- Coordinates: AOI bbox west `-121.90`, south `37.48`, east `-121.74`, north `37.60`.
- Map center: about lat `37.54`, lon `-121.82`.
- All actors, launch packages, route branches, decision target zones, no-go zones, events, and decision outputs are synthetic.

### Existing Upload Bundle

Bundle root: `resources/palantir_sunol_aoi_upload/`

Files/layers:

- `manifest.json`
- `aoi/sunol_training_area_aoi.geojson`
- `osm/osm_power_lines.geojson`
- `osm/osm_power_towers_poles.geojson`
- `osm/osm_roads_tracks_paths.geojson`
- `osm/osm_buildings.geojson`
- `osm/osm_natural_features.geojson`
- `osm/osm_vegetation_landcover.geojson`
- `osm/osm_waterways_barriers.geojson`
- `official_power/cec_transmission_lines.geojson`
- `official_power/hifld_transmission_lines.geojson`
- `terrain/elevation_samples_500m.csv`
- `terrain/terrain_attention_points.geojson`
- `mission_fixture/synthetic_unit_route.geojson`
- `mission_fixture/synthetic_drone_waypoints.geojson`
- `mission_fixture/synthetic_route_branches.geojson`
- `mission_fixture/synthetic_cue_zones.geojson`
- `mission_fixture/synthetic_no_go_zones.geojson`

Import `synthetic_cue_zones.geojson` as initial `DecisionTargetZone` objects where properties support that mapping. If the file only contains generic cue-zone properties, preserve them and add a normalized target-zone object view for the corrected PRD.

Current generated counts:

| Layer | Count |
| --- | ---: |
| AOI | 1 |
| OSM power lines | 38 |
| OSM power towers/poles | 268 |
| roads/tracks/paths | 727 |
| buildings | 312 |
| natural features | 124 |
| vegetation/landcover | 61 |
| waterways/barriers | 485 |
| CEC transmission lines | 26 |
| HIFLD transmission lines | 17 |
| elevation samples | 783 |
| terrain attention points | 4 |
| synthetic unit route | 1 |
| synthetic drone waypoints | 5 |
| synthetic route branches | 3 |
| synthetic cue/target zones | 3 |
| synthetic no-go zones | 2 |

---

## 4. Information Architecture And Screen Layout

### Required First Screen

The app opens directly into the planner shell:

- Full-screen map.
- Top toolbar with mission name, provider/source status, and Plan Mission / Launch Simulation switch.
- Map view controls over map: `Topo`, `3D Sat`, `Recenter 5 km`, terrain status.
- Right rail with planner, selected object, and launch simulation panels.
- Bottom status bar with provider/load state, cursor Lat/Lon, cursor MGRS, selected object status, and simulation state.
- Compact map legend overlay in lower-right or collapsible map panel.

### UI Style

Use a sober operational interface:

| Token | Value / intent |
| --- | --- |
| Page background | `#101312`, dark green-black |
| Map shell | `#15211d` base |
| Primary text | `#eef1eb` |
| Muted text | `#aeb8ad` |
| Amber control | `#ffd166` |
| Simulation/teal accent | `#6de0d2` |
| Route yellow | `#fbbf24` |
| Camera blue | `#7ee7ff` |
| Scan purple | `#a78bfa` |
| Preview/attention pale yellow | `#fff1a8` |
| No-go red | `#ff5c5c` |
| Power orange | `#ff8f3d` |
| Unit route green | `#8ec07c` |
| Border radius | 8px |
| Panels | translucent dark, subtle border, readable contrast |

Avoid marketing sections, oversized hero copy, ornamental graphics, or separate demo-only screens.

---

## 5. Workflow Model

### Plan Mission

Plan Mission is the editable build surface.

Requirements:

- Create mission from empty or loaded baseline.
- Add or confirm launch point.
- Add ordered surveillance waypoints by clicking map.
- Maintain multiple named launch packages.
- Pick behavior before placement from a marker palette.
- Select a waypoint from map or outline.
- Show waypoint sequence, behavior glyph, coordinates, status, and provenance/source.
- Add decision points along waypoints or route segments.
- Place one or more decision target zones for each decision point.
- Configure waypoint behavior, objective, surveillance parameters, dwell/scan parameters, branch attachments, timeout behavior, hold behavior, Land behavior, and validation expectations.
- Allow route segment details when segment behavior matters.
- Recompile live after each edit:
  - route distance
  - simulated timeline
  - battery/range warnings
  - state-machine outline
  - decision graph
  - target-zone validity
  - Palantir action/export payload status

### Launch Package Simulation

Launch Package Simulation is the simulated playback surface.

Requirements:

- Start from the active launch package's launch point.
- Auto-play through route states.
- Pause automatically at each decision point.
- Keep manual controls available:
  - Play/Pause
  - Next Step
  - Previous Step
  - Jump to Decision
  - Reset Simulation
- Show current state, elapsed simulated time, active waypoint/segment, active decision point, selected target zone, PPS event, selected branch/action, and audit log.
- Apply valid PPS events in simulation without an extra confirmation click.
- Reject invalid PPS events and log the reason.
- Discard simulation state when reset, but preserve authored launch package.
- Never imply live drone command or hardware input.

### Simulation States

Minimum simulation states:

- Package Ready
- Simulated Launch
- Transit
- Scout / Observe / Scan
- Decision Pause
- Hold / Loiter
- Primary Branch Active
- Alternate Branch Active
- Land / recover
- Land / Recover
- Abort / Emergency

---

## 6. Waypoint, Decision, And Target-Zone Planner

### Waypoint Behavior Vocabulary

| Behavior | Intent | Map glyph/overlay | Panel fields |
| --- | --- | --- | --- |
| Launch | Start simulated package | pad disc + stem | launch checklist, home reference |
| Transit | Move without collection emphasis | subtle diamond/through node | speed profile if modeled |
| Scout | Inspect ahead of the unit | orbit ring or scout marker | fixation point, radius, dwell |
| Scan area | Cover an area/corridor | frame/bracket + scan footprint | overlap, altitude band, exit condition |
| Observe | Sensor-focused watch | stable post + blue stare stub | dwell, FOV, priority target |
| Hold/loiter | Wait at planned hold | anchor ring + dwell ticks | duration, timeout, exit path |
| Decision point | Pause for PPS target-zone evaluation | decision head + target-zone link | primary/alternate/hold/Land attachments |
| Land / recover | Simulated return/recovery | touchdown brackets | fuel margin, path |
| Land/recover | End simulated package | touchdown brackets | recovery point, approach |
| Abort/emergency | Stop simulated progression | octagon/stop plate | acknowledgement and reason |

### Decision Target Zones

Decision target zones are placed map circles or polygons associated with a decision point. They represent where a simulated PEQ/PPS pulse is aimed during Launch Package Simulation.

Required behavior:

- A decision point can have one or more target zones.
- A PPS event must name or select a target zone.
- The active simulation state must match the target zone's decision point.
- A cue outside the selected/active target zone is rejected.
- Target zones display Lat/Lon, MGRS, associated decision point, allowed pulses, and source/provisional status.
- Target zones are distinct from no-go zones, terrain attention points, and generic context overlays.

### Required Launch Package Fields

- `id`
- `mission_id`
- `name`
- `unit_route_id`
- `launch_point`
- `drone_profile_id`
- `status`
- `waypoint_ids`
- `route_segment_ids`
- `decision_point_ids`
- `validation_status`
- `warnings`
- `compiled_state_graph_id`
- `created_at`
- `updated_at`
- `source_name`
- `evidence_refs`
- `provisional`

### Required Decision Target Zone Fields

- `id`
- `mission_id`
- `launch_package_id`
- `decision_point_id`
- `name`
- `geometry`
- `lat`
- `lon`
- `mgrs_display`
- `allowed_pulses_pps`
- `selected_action_by_pps`
- `validation_status`
- `warnings`
- `source_name`
- `source_url`
- `retrieved_at`
- `evidence_refs`
- `provisional`

### Required Pulse Cue Event Fields

- `id`
- `mission_id`
- `launch_simulation_id`
- `decision_point_id`
- `decision_target_zone_id`
- `observed_pulse_rate_pps`
- `observed_at`
- `simulated_position`
- `zone_validation_status`
- `state_validation_status`
- `selected_action`
- `selected_branch_id`
- `rejection_reason`
- `warnings`
- `audit_event_id`
- `evidence_refs`

---

## 7. Map Layers And Symbology

### Layer Catalog

| Layer | Purpose | Default | Style |
| --- | --- | --- | --- |
| AOI | mission boundary | on | amber/yellow boundary, low fill |
| Unit route/checkpoints | friendly movement context | on | muted green |
| Launch package route | primary surveillance route | on | yellow route grammar |
| Primary/alternate branches | decision route options | on near decision | yellow route grammar plus labels |
| Decision target zones | PPS simulation targets | on in planning/simulation | pale yellow/teal outline, terrain-clamped |
| Power infrastructure | obstacle/context | off | orange caution |
| Roads/tracks/paths | movement context | off | neutral thin line |
| Buildings | context | off | neutral footprint |
| Vegetation/landcover | terrain context | off | subdued fill |
| Terrain attention | obstacle/high ground/gap review | off | teal pins/polygons |
| No-go/review zones | hard constraint/review | off or warning-visible | red fill/hatch |
| Tactical units | land unit overlays | as available | 2525D SVG, top z-order |

### Global Map Rules

| ID | Rule |
| --- | --- |
| R1 | Untread/not-yet-simulated drone route is dotted yellow, about 50% opacity. |
| R2 | Simulated/committed route behind current playback state is solid yellow, about 50% opacity. |
| R3 | Yellow means drone surveillance route/timeline only; never use yellow fills for collection footprints. |
| R4 | Camera/FOV overlays are light blue wedges, rays, or pan arcs. |
| R5 | Scan/surveillance footprint uses a non-yellow fill/stroke. |
| R6 | Waypoint markers share a stem; behavior changes head/halo/attachments. |
| R7 | Inactive branch options are visually lighter; active simulated branch is highlighted after PPS selection. |
| DTZ | Decision target zones use circle/polygon geometry with labels and PPS affordances. |

### Legend

Legend must include:

- Untread route
- Simulated route
- Active primary branch
- Active alternate branch
- Decision target zone
- Scan/surveillance footprint
- Camera/FOV
- No-go/review zone
- Training/planning-only label
- Tactical unit affiliation legend if 2525D units are displayed

### Icons And Glyphs To Use

Use the existing local glyph vocabulary from `src/symbology/isrMapSymbology.ts` and the 2525D SVG catalog in `assets/icons/`. Do not invent a separate icon family for the Palantir backup UI.

Waypoint and launch-package glyphs:

| UI object | Glyph shape | Short label | Color | Notes |
| --- | --- | --- | --- | --- |
| Launch | `pad` | `L` | `#fbbf24` | Simulated package start. |
| Transit | `diamond` | `T` | `#facc15` | Pass-through route node. |
| Scout | `orbit` | `S` | `#34d399` | Pair with scan/camera overlays when active. |
| Scan area | `frame` | `SA` | `#a78bfa` | Anchors non-yellow scan footprint. |
| Fly-by | `chevron` | `F` | `#38bdf8` | Optional pass-through behavior. |
| Observe | `post` | `O` | `#7ee7ff` | Pair with camera/FOV overlay. |
| Hold/loiter | `anchor` | `H` | `#fb923c` | 1 PPS simulation action. |
| Decision point | `decision` | `D` | `#f97316` | Simulation pause state; links to target zones. |
| Land / recover | `touchdown` | `LD` | `#60a5fa` | 2 PPS simulation action. |
| Land/recover | `touchdown` | `LD` | `#60a5fa` | Terminal simulated recovery. |
| Abort/emergency | `octagon` | `!` | `#f87171` | Stop simulated progression. |

Decision target zone icon:

- Use a terrain-clamped circle or polygon with a small reticle/crosshair center marker.
- Stroke: `#fff1a8`; active stroke/accent: `#6de0d2`; fill alpha should stay low enough to see terrain.
- Label format: `DTZ-{number}` plus associated decision point name when space allows.
- Show compact PPS chips near the selected zone: `1 Hold`, `2 Land`, `4 Primary`, `8 Alt`.
- When selected during simulation, draw a stronger outline and a short light-blue simulated aim ray from the active route/decision point to the target-zone center.

Simulation and context icons:

| UI object | Icon treatment |
| --- | --- |
| Active simulated drone position | Small heading arrow/POV marker on the route, with optional light-blue camera V/FOV. |
| Terrain attention point | Teal pin/flag, with type label for obstacle, scout high ground, or coverage gap. |
| No-go/review zone | Red hatched polygon and stop/blocked badge in the selected-object panel. |
| Camera/FOV | Light-blue wedge, short ray, or pan arc. |
| Scan/surveillance footprint | Non-yellow polygon/corridor/ribbon, usually scan purple. |
| Power/infrastructure | Thin orange caution line/point treatment; keep visually quieter than route and target zones. |

Tactical unit icons:

- Use MIL-STD-2525D SVG output from `milsymbol` or the checked-in SVGs under `assets/icons/`.
- Persist 30-character SIDC strings.
- Render tactical units above route graphics and context layers.
- Initial catalog:
  - `land-infantry-friendly.svg`: `100310000012110000000000000000`
  - `land-infantry-hostile.svg`: `100610000012110000000000000000`
  - `land-infantry-neutral.svg`: `100410000012110000000000000000`
  - `land-infantry-unknown.svg`: `100710000012110000000000000000`
  - `land-motorized-recon-friendly.svg`: `100310000012130300000000000000`
  - `land-motorized-recon-hostile.svg`: `100610000012130300000000000000`

### Z-Order

- `0`: tactical units / drone marker / active simulation marker / critical symbols
- `10`: active decision target zone and active decision point
- `20`: waypoints and route graphics
- `40`: terrain/context/basemap layers

---

## 8. PEQ/PPS Simulation And Branch Selection

### Command Grammar

| Simulated cue | Simulation action | Notes |
| --- | --- | --- |
| `1 PPS` | Hold / loiter | valid only at an armed decision point/target zone |
| `2 PPS` | Land / recover | valid only at an armed decision point/target zone |
| `4 PPS` | Primary route | selects the attached primary branch |
| `8 PPS` | Alternate route | selects the attached alternate branch |
| no pulse / unknown | No state change | log warning or ignored event |

### Validation Gates

- Simulation is currently paused at a decision point.
- Selected decision target zone belongs to the active decision point.
- PPS event is simulated against the selected target zone.
- Pulse rate is in the approved grammar.
- Mapped action is allowed from current simulation state.
- Required branch/hold/Land target exists.
- Target route/action passes no-go, terrain, and route validity checks.
- Cue timestamp/source/audit metadata are recorded.

### Decision Pause Panel

Fields:

- active decision point
- selected decision target zone
- target zone Lat/Lon
- target zone MGRS
- PPS buttons: 1, 2, 4, 8
- validation result
- selected action
- selected branch name
- warnings/rejection reason
- audit log entry

---

## 9. State Machine And Simulation Graph

### Concept

The launch package is compiled from topology into simulation state nodes:

- Topology: ordered waypoints, route segments, decision points, branch subgraphs, decision target zones.
- State nodes: waypoints and segments with custom surveillance logic.
- Simulation runtime: current state, playback status, simulated clock, current route segment, active decision pause, pending PPS event, selected branch/action, and logs.

### Event -> Guard -> Action

Use this pattern for all simulation events:

1. Event happens.
2. Guard checks whether it is valid from current simulation state.
3. Action advances playback, pauses playback, applies PPS branch/action, highlights map state, and logs.
4. Default timeout behavior runs if no valid input arrives where configured.

### Event Types

- package compiled
- simulation started
- playback tick
- play/pause
- next step
- previous step
- jump to decision
- segment start
- waypoint arrival
- decision pause reached
- decision target zone selected
- PPS simulated
- branch/action selected
- hold complete
- Land selected
- land/recover reached
- obstacle/review warning
- timeout
- battery/endurance threshold
- validation block

### Decision Point Fields

- `entry_state_ids`
- `decision_target_zone_ids`
- `primary_branch_id`
- `alternate_branch_id`
- `hold_branch_id`
- `land_branch_id`
- `allowed_pulses_pps`
- `timeout_behavior`
- `validation_gate_ids`
- `active_pause_label`

---

## 10. Palantir Ontology / Dataset Model

### Mission Objects

| Object type | Purpose | Key relationships |
| --- | --- | --- |
| `Mission` | top-level scenario and safety scope | contains AOI, unit route, packages, simulation logs |
| `AreaOfInterest` | boundary geometry | belongs to Mission |
| `UnitRoute` | moving unit route/checkpoints | anchors launch packages and decision context |
| `Checkpoint` | route timing/location hook | can relate to a launch package or decision point |
| `DroneProfile` | platform assumptions | used by packages and validators |
| `LaunchPackage` | user-authored surveillance package | has waypoints, segments, decisions, branches |
| `LaunchSimulation` | active simulated playback | belongs to LaunchPackage |
| `DroneWaypoint` | ordered waypoint/state node | belongs to LaunchPackage |
| `RouteSegment` | connection between waypoints | may hold decision or surveillance behavior |
| `DecisionPoint` | simulation pause/evaluation state | owns target zones and branch attachments |
| `DecisionTargetZone` | PPS simulation target geometry | belongs to DecisionPoint |
| `PrimaryRouteBranch` | 4 PPS branch geometry | attaches to DecisionPoint |
| `AlternateRouteBranch` | 8 PPS branch geometry | attaches to DecisionPoint |
| `HoldBranch` | 1 PPS hold geometry/state | attaches to DecisionPoint |
| `LandBranch` | 2 PPS return/recovery path | attaches to DecisionPoint |
| `PulseCueEvent` | simulated PPS event | creates state transition or rejection |
| `MissionStateNode` | compiled state | from package topology |
| `MissionStateTransition` | simulation transition | logged from events |
| `AuditLogEvent` | immutable simulation/review log | belongs to Mission/Simulation |
| `ValidationWarning` | hard/soft finding | linked to plan/object/stage |
| `Observation` | synthetic report/unknown/contact | can inform surveillance decisions |

### Context Objects

| Object type | Purpose |
| --- | --- |
| `TerrainAttentionPoint` | obstacle candidate, high-ground scout point, coverage gap, manual obstacle |
| `NoGoZone` | hard or review zone |
| `TacticalUnit` | 2525D land/squad unit symbol |
| `InfrastructureFeature` | power lines, towers, poles, transmission |
| `RoadOrPath` | route and access context |
| `Building` | structure context |
| `NaturalFeature` | terrain/water/vegetation/barrier context |
| `SourceManifest` | source status, counts, provenance |

### Provenance Fields

Preserve on imported or generated objects:

- `source_name`
- `source_url`
- `retrieved_at`
- `generated_at`
- `layer_id`
- `source_health`
- `evidence_refs`
- `validation_status`
- `provisional`
- `notes`

---

## 11. API / Function / Action Contract

### Backup Mapping UI Handoff Defaults

Use these answers when another agent asks for implementation choices before building the backup mapping UI:

| Question | Answer |
| --- | --- |
| Map library preference | **Cesium / Resium.** Prefer Resium for a React implementation, with direct CesiumJS acceptable where it is simpler. This matches the current local Vite/Cesium app and supports 3D terrain, elevated route review, terrain-clamped target zones, and WGS84 mission layers. |
| Hosting target | **Both.** Primary target is an OSDK React Application inside Foundry so it can use Foundry user auth and deploy on `*.palantirfoundry.com`. Also keep a local/static Vite run path that can run with `npm run dev` against Foundry Functions REST using a manually issued bearer token. |
| Authentication target | **Create one.** No OAuth Client ID or redirect URI is committed in this repo. Create a public OAuth client for the OSDK React app with redirect URI set to the deployed app URL. Do not commit client secrets, generated credentials, user tokens, or `.env.local`. |
| Foundry hostname | `nshackathon.palantirfoundry.com` |
| Ontology RID | `ri.ontology.main.ontology.41fccd0c-2180-4c1d-841d-8a488d1abb46` |
| Local REST token fallback | Support `window.__FOUNDRY_BEARER_TOKEN__`, `localStorage.foundryBearerToken`, or ignored local env `VITE_FOUNDRY_BEARER_TOKEN`. |

The current repo has a read-only Functions REST path and an OSDK adapter seam. The backup UI should prefer OSDK/Foundry-hosted auth when available, but it must remain runnable locally for hackathon fallback and debugging.

### Read Functions

All functions return JSON or GeoJSON-compatible objects, WGS84 geometry, provenance, warnings, and status.

| Function | Purpose |
| --- | --- |
| `getMissionBundle()` | metadata, generated time, safety scope, source statuses, layer counts |
| `getAoi()` | AOI FeatureCollection/object |
| `getMapContextLayers()` | available roads/buildings/natural/vegetation/barrier/infrastructure refs |
| `getInfrastructureContext()` | power/tower/transmission FeatureCollection |
| `getTerrainAttentionPoints()` | attention points with rationale/confidence/task |
| `getMissionRoute()` | unit route, checkpoints, and baseline waypoints |
| `getLaunchPackages()` | surveillance launch packages and summaries |
| `getLaunchSimulation()` | active simulation state and controls |
| `getRouteBranches()` | primary, alternate, hold, and Land branch geometry |
| `getDecisionTargetZones()` | target zones with PPS action mapping |
| `getNoGoZones()` | no-go/review zones |
| `getSourceManifest()` | manifest/source-health evidence |
| `getMissionStateGraph()` | compiled topology/state/edge graph |
| `getAuditLog()` | simulation and review log events |

### Planning Actions

All actions must append or reference an audit log entry and return updated validation warnings.

| Action | Purpose |
| --- | --- |
| `createLaunchPackage` | create empty surveillance package |
| `updateLaunchPackage` | rename/status/edit package metadata |
| `addDroneWaypoint` | add ordered waypoint from map click |
| `updateDroneWaypoint` | edit behavior/objective/triggers/position |
| `deleteDroneWaypoint` | remove waypoint and resequence |
| `updateRouteSegment` | edit segment behavior |
| `addDecisionPoint` | add simulation pause/evaluation state |
| `addDecisionTargetZone` | add target zone for a decision point |
| `attachPrimaryRouteBranch` | attach 4 PPS branch |
| `attachAlternateRouteBranch` | attach 8 PPS branch |
| `attachHoldBranch` | attach 1 PPS hold action |
| `attachLandBranch` | attach 2 PPS Land/recover path |
| `addNoGoZone` | add manual review/no-go area |
| `placeTacticalUnit` | add 2525D land unit |
| `updateTacticalUnit` | edit SIDC/affiliation/label/position |
| `compileLaunchPackage` | generate state graph, simulation timeline, warnings |

### Simulation Actions

| Action | Purpose |
| --- | --- |
| `startLaunchSimulation` | create active simulation from compiled package |
| `pauseLaunchSimulation` | pause playback |
| `resumeLaunchSimulation` | resume auto playback |
| `stepLaunchSimulation` | move next/previous state according to request |
| `jumpLaunchSimulationToState` | jump to a named state or decision point |
| `simulateDecisionZoneCue` | create PulseCueEvent for selected target zone and PPS |
| `selectSimulationBranch` | apply validated PPS action to simulation state |
| `appendAuditLogEvent` | generic audit append |

### Example Response Shape

```json
{
  "status": "ready",
  "mission_id": "sunol-surveillance-training",
  "data": {},
  "warnings": [],
  "selected_action": "primary_route",
  "provenance": {
    "source_name": "synthetic_fixture",
    "retrieved_at": "2026-05-03T04:15:44.993Z",
    "provisional": true
  },
  "audit_event_id": "audit-optional"
}
```

---

## 12. Validation And Governance

### Validation Status Vocabulary

- `validated`: backed by tests, fixtures, source evidence, live runtime evidence, or accepted review artifact.
- `provisional`: useful but missing calibration, coverage, or cross-checking.
- `todo`: known gap, placeholder, or deferred slice.

### Launch Simulation Hard Blocks

- No launch waypoint.
- No compiled launch package.
- Missing required decision target zone for an armed decision point.
- Missing primary branch for a decision point that accepts 4 PPS.
- Missing alternate branch for a decision point that accepts 8 PPS.
- Missing hold action for a decision point that accepts 1 PPS.
- Missing Land/recover path for a decision point that accepts 2 PPS.
- Invalid route geometry.
- No-go zone conflict.
- Unfinished surveillance waypoint configuration.
- Mission-invalid actor/unit state.

### PPS Rejection Reasons

- Simulation is not paused at a decision point.
- No target zone selected.
- Target zone does not belong to the active decision point.
- Simulated cue is outside the selected/active target zone.
- Pulse rate is unsupported.
- Mapped action has no attached branch/path.
- Mapped action fails route/no-go/terrain validation.
- Event timestamp or state is stale.

### Warnings

- Missing terrain profile.
- Sparse/stale terrain samples.
- Missing provenance.
- Provisional source.
- Route near power/infrastructure context.
- Range/endurance/battery margin uncertainty.
- Route outside configured demo bounds.
- Unknown/no-pulse/ambiguous cue ignored.

### Formula / Rule IDs To Preserve

- `demo_launch_package_pps_branch_mapping_v3`: `1 PPS = hold`, `2 PPS = Land`, `4 PPS = primary route`, `8 PPS = alternate route`.
- `demo_drone_route_default_altitude_agl_v2`: default `20 m AGL`.
- `demo_terrain_attention_points_v1`: provisional terrain attention point generation.

Any new scoring, threshold, freshness window, confidence score, or heuristic must be registered before it is treated as authoritative.

---

## 13. Terrain And Altitude

### Default Rule

- Planned route altitude defaults to `20 m AGL`.
- Editable per-waypoint altitude is a stretch item.
- This is a planning assumption, not certified obstacle clearance.

### Required Fields

- `terrain_elevation_m`
- `altitude_agl_m`
- `altitude_msl_m`
- `terrain_source_ref`
- `terrain_status`
- `evidence_refs`
- `warnings`

### Degraded Behavior

If terrain elevation is unavailable:

- Preserve route geometry.
- Mark terrain status as degraded/missing.
- Show a warning in selected-object details and validation panel.
- Do not silently render terrain-aware route at ground level.

---

## 14. Drone Profile Assumptions

### MVP Drone

V1 centers on Skydio X10D ISR/surveillance.

Useful planning constants:

- Max flight time: 40 minutes.
- Max hover time: 35 minutes.
- Max transit speed with obstacle avoidance: 16 m/s.
- Assumed planning range: 5 km.
- Default planned route altitude: 20 m AGL.
- ISR payload assumptions are provisional and must display source/provisional status.

### Future / Not MVP

Neros Archer FPV is documented as a future or comparison profile. Do not include kinetic behavior in the Palantir backup MVP.

---

## 15. Natural-Language / AIP Behavior

Natural-language features are useful only when cited and bounded.

Allowed:

- "Why did the simulation select the primary route?"
- "What warnings block launch simulation?"
- "Which target zone received the PPS event?"
- "Which source supports this terrain attention point?"
- "Summarize the current simulation log."
- "Show all objects related to this pulse cue event."
- "Explain why this cue was rejected."

Requirements:

- Cite mission objects, pulse cue events, warnings, and source refs.
- Distinguish validated from provisional evidence.
- Never create real drone commands or hardware actions from natural language.

---

## 16. Demo Script And Acceptance Criteria

### One-Minute Demo Path (user will create this but you can use it for tests)

1. Load Sunol mission.
2. Show AOI, ground unit route, and surveillance planning map.
3. Show Launch Packages panel and ordered waypoint queue.
4. Add or select launch, transit, observe/scout, decision, and Land waypoints.
5. Place a decision point and decision target zone.
6. Show terrain attention point and no-go context.
7. Start Launch Package Simulation.
8. Auto-play from simulated launch through route progress.
9. Pause automatically at the decision point.
10. Select a decision target zone.
11. Simulate `4 PPS`.
12. Show the primary route selected, highlighted, and logged.
13. Reset or jump back to the decision point.
14. Simulate `8 PPS`.
15. Show the alternate route selected, highlighted, and logged.
16. Simulate an outside-zone cue and show rejection in the audit log.

### Interactive Judge Acceptance

A judge must be able to:

- Create or select a launch package.
- Add a waypoint to a surveillance route.
- Select waypoint behavior.
- Add a decision point.
- Place or select a decision target zone.
- Start, pause, resume, step, and jump the launch simulation.
- Watch simulation pause at a decision point.
- Trigger 1/2/4/8 PPS against a selected target zone.
- See 4 PPS select the primary route.
- See 8 PPS select the alternate route.
- See 1 PPS hold/loiter.
- See 2 PPS route to Land/recover.
- See outside-zone or invalid-state cue rejection.
- Inspect source provenance.
- See MGRS and Lat/Lon.
- See validation warnings update.
- See audit log entries.

### Palantir-Specific Acceptance

- Imported files become structured objects or datasets.
- Existing cue-zone fixtures are normalized into decision target zones where possible.
- Ontology relationships exist between mission, launch package, waypoints, decision points, target zones, branches, simulation state, warnings, and audit events.
- Functions/actions expose app-ready JSON/GeoJSON.
- At least one action path writes a simulation audit event.
- Palantir Map/Workshop view shows the launch package simulation workflow, not just static uploaded layers.

---

## 17. Open Questions

- Exact Palantir permissions available: Map, Workshop, Ontology Manager, Actions, AIP, Functions, file import, OSDK.
- Whether custom ontology object types can be created during the event.
- Whether write actions are available immediately or the MVP must simulate writes in client state and only read from Palantir.
- Whether target zones are always circles in v1 or may also be polygons.
- Which validation rules become hard blocks vs warnings after team review.

---

## 18. Non-Negotiables

- The app is a real surveillance launch-package planner, not a static dashboard.
- Launch is simulated in the MVP.
- Simulation auto-plays and pauses at decision points.
- Manual step and jump controls remain available.
- Decision target zones are placed map geometry linked to decision points.
- PPS is simulated against a selected target zone.
- `1 PPS` holds/loiters.
- `2 PPS` routes to Land/recover.
- `4 PPS` selects the primary route.
- `8 PPS` selects the alternate route.
- Valid PPS applies the simulated branch/action and logs it.
- Invalid PPS never changes route state and must log why.
- Yellow is only drone surveillance route.
- Scan, camera, route, target zone, no-go, and unit overlays remain visually distinct.
- Geometry is WGS84; display includes MGRS.
- Provenance and warnings stay visible.
- No real drone control or kinetic/strike/weapon/target-selection workflow.
