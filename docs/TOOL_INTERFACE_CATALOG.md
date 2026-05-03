# Tool Interface Catalog

This is the review guide for the current `x-tech-hackathon` tool, validator, and workflow surface.
Every public stage should be documented here before agents depend on it.

Current state: Goal 0002 adds a provisional frontend runtime data-provider boundary, `mission_data_provider_runtime`, for choosing a Foundry-hosted adapter/Functions path when available and falling back to static scoped bundle data. Goal 0003 adds `mission_run_rehearsal_runtime` for app-side Plan Mission / Run Mission rehearsal. Goal 0005 implements the provisional `optical_cue_interpreter_demo` as a local pure preview interpreter. The rebuild app adds `rebuild_planner_runtime`, a local Next.js backend-backed authoring and simulation runtime in `apps/rebuild-planner`. `terrain_attention_point_generator_demo` and `terrain_aware_route_altitude_profile_demo` remain planned provisional stages for upcoming implementation slices.

## Field Glossary
- `[field_name]`: `[description]` Units: `[units or enum or not_applicable]`.
- `support_level`: Current research maturity or confidence band for a stage result. Units: enum.
- `evidence_refs`: Source references attached to a stage result. Units: list.
- `output_root`: Directory where artifacts and reports should be written. Units: path.

## `optical_cue_interpreter_demo`
- Display name: Optical Cue Interpreter Demo
- Category: `pre_validation`
- Stage order: `1`
- Purpose: Map a simulated PEQ-15-style PPS cue observation to a previewed drone mission command.
- When to call: When a fixture, UI click, or demo camera event produces an observed pulse-rate cue.
- When not to call: Do not call for real hardware control, authenticated IFF, autonomous targeting, or operational drone command.
- Input type: Structured cue observation.
- Output type: Command preview with status, rationale, evidence refs, and required confirmation state.
- Supported use cases: ISR/recon mission planning demo; route branch preview; hold/loiter preview; RTB preview.
- Supported data or source families: Simulated cue events; fixture-backed cue observations; map-click replay events.
- Status values: `passed | failed | skipped | warning | blocked`
- Hard-fail vs warning behavior: Unknown, ambiguous, stale, out-of-window, out-of-sector, or state-invalid cues block automatic transition and route to human review.
- Formula or rule groups: `demo_optical_cue_pps_command_mapping_v1`
- Support level: `provisional`
- Platform support: `not_applicable`
- Required binaries or services: `none`
- Headless expectations: Pure interpreter should run headlessly against fixtures.
- Degraded modes: If cue confidence is unavailable, require human review.
- Source module: `src/data/ppsCuePreview.ts`
- Kernel id: `optical_cue_interpreter_kernel`
- Kernel boundary: Deterministic mapping and validation of cue observation to command preview.
- Pure function expected: `yes`
- Required input fields:
  - `observed_pulse_rate_pps` (`number`): Detected pulse rate. Units: `pulses_per_second`.
  - `observed_at` (`string`): Observation timestamp. Units: `ISO-8601`.
  - `mission_state` (`string`): Current state-machine node. Units: `enum`.
  - `expected_sector` (`string`): Sector or map region where cue is expected. Units: `enum_or_region_id`.
  - `observed_sector` (`string`): Sector or map region where cue was observed. Units: `enum_or_region_id`.
- Optional input fields:
  - `confidence` (`number`): Cue detection confidence. Units: `0..1`.
  - `source_ref` (`string`): Fixture, UI event, or detector reference. Units: `id`.
- Derived fields: `matched_command`, `requires_confirmation`, `rejection_reason`, `evidence_refs`
- Minimal valid example input:
```json
{
  "observed_pulse_rate_pps": 2,
  "observed_at": "2026-05-02T19:00:00Z",
  "mission_state": "decision_point_alpha",
  "expected_sector": "north_approach",
  "observed_sector": "north_approach",
  "confidence": 0.92
}
```
- Example output summary:
```json
{
  "status": "passed",
  "matched_command": "preview_route_a",
  "requires_confirmation": true,
  "evidence_refs": [
    "demo_optical_cue_pps_command_mapping_v1"
  ]
}
```
- Current gaps / TODO notes:
  - PRD must confirm continuous/no-pulse behavior beyond the current warning/ignored-event path.
  - Context gates are shallow until full mission state validators exist.

## `terrain_attention_point_generator_demo`
- Display name: Terrain Attention Point Generator Demo
- Category: `selection`
- Stage order: `2`
- Purpose: Generate fixture-backed planning aids for obstacles, scout-worthy terrain, no-go zones, and coverage gaps along a moving unit route.
- When to call: After the mission route, planning corridor, drone profile, and terrain/context fixtures are loaded.
- When not to call: Do not call for operational terrain certification, autonomous obstacle avoidance, targeting, or real drone flight safety.
- Input type: Mission route, corridor, terrain/context fixtures, manual map features, and drone profile.
- Output type: GeoJSON-like terrain attention points with rationale, confidence, and source refs.
- Supported use cases: Moving-unit drone overwatch planning; route option explanation; map overlay generation.
- Supported data or source families: Fixture terrain; manually drawn map features; future DEM-derived terrain samples.
- Status values: `passed | failed | skipped | warning | blocked`
- Hard-fail vs warning behavior: Missing route or corridor blocks generation; missing terrain data degrades to manual features and fixture defaults.
- Formula or rule groups: `demo_terrain_attention_points_v1`
- Support level: `provisional`
- Platform support: `not_applicable`
- Required binaries or services: `none` for fixture mode.
- Headless expectations: Pure generator should run headlessly against fixtures.
- Degraded modes: Manual-only attention points when terrain fixtures are absent.
- Source module: `todo`
- Kernel id: `terrain_attention_point_kernel`
- Kernel boundary: Deterministic mapping from route/corridor/context fixtures to attention-point overlays.
- Pure function expected: `yes`
- Required input fields:
  - `unit_route` (`GeoJSON LineString`): Planned unit movement route. Units: `WGS84 coordinates`.
  - `planning_corridor` (`GeoJSON Polygon`): Buffered route corridor. Units: `WGS84 coordinates`.
  - `drone_profile` (`object`): Demo drone speed, endurance, sensor radius, and hold defaults. Units: `mixed`.
- Optional input fields:
  - `terrain_cells` (`array`): DEM-derived or fixture terrain samples. Units: `structured_grid_or_fixture`.
  - `manual_features` (`GeoJSON FeatureCollection`): Operator-drawn obstacles, no-go zones, or scout candidates. Units: `WGS84 coordinates`.
  - `planned_drone_routes` (`GeoJSON FeatureCollection`): Candidate drone routes and holds. Units: `WGS84 coordinates`.
- Derived fields: `attention_type`, `rationale`, `related_route_segment`, `recommended_drone_task`, `confidence`, `evidence_refs`
- Minimal valid example input:
```json
{
  "unit_route": {
    "type": "LineString",
    "coordinates": [[-122.4, 37.8], [-122.39, 37.81]]
  },
  "planning_corridor": {
    "type": "Polygon",
    "coordinates": [[[-122.401, 37.799], [-122.389, 37.809], [-122.391, 37.811], [-122.403, 37.801], [-122.401, 37.799]]]
  },
  "drone_profile": {
    "sensor_radius_m": 300,
    "endurance_minutes": 30
  }
}
```
- Example output summary:
```json
{
  "status": "passed",
  "attention_points": [
    {
      "attention_type": "scout_high_ground",
      "recommended_drone_task": "preview_route_b",
      "evidence_refs": ["demo_terrain_attention_points_v1"]
    }
  ]
}
```
- Current gaps / TODO notes:
  - Fixture thresholds and route-corridor geometry still need implementation.
  - External DEM ingestion is optional and should come after the fixture demo works.

## `terrain_aware_route_altitude_profile_demo`
- Display name: Terrain-Aware Route Altitude Profile Demo
- Category: `selection`
- Stage order: `3`
- Purpose: Add provisional above-terrain altitude profiles to planned drone route branches for 3D review and API/function consumption.
- When to call: After drone route branch geometry and terrain elevation samples/context are loaded, and before Cesium 3D rendering, bundle export, or API/function reads expose route branches.
- When not to call: Do not call for certified flight planning, real drone command, autopilot upload, MAVLINK/GCS export, autonomous obstacle avoidance, or operational terrain clearance.
- Input type: Planned drone route branches, terrain elevation samples/context, default altitude rule, and optional drone profile.
- Output type: Route branch geometry or waypoint records with AGL/MSL altitude metadata, terrain provenance, and degraded-status warnings.
- Supported use cases: Cesium 3D elevated route visualization; Foundry/OSDK route branch API contract; fixture-backed mission planning review.
- Supported data or source families: Goal 0001 elevation samples; fixture terrain; future DEM-derived terrain samples; Cesium terrain for visual review where available.
- Status values: `passed | warning | degraded | blocked`
- Hard-fail vs warning behavior: Missing route geometry blocks altitude profiling; missing, stale, or sparse terrain data degrades the profile and must surface a warning instead of silently using ground-level coordinates.
- Formula or rule groups: `demo_drone_route_default_altitude_agl_v1`
- Support level: `provisional`
- Platform support: `local Vite; Foundry-hosted API/function surface compatible`
- Required binaries or services: `node`, `npm`; no live terrain service required for fixture mode.
- Headless expectations: Pure profile helper should run headlessly against fixture route branches and terrain samples.
- Degraded modes: Preserve route geometry with `terrain_status` and warnings when terrain elevation is unavailable.
- Source module: `todo`
- Kernel id: `terrain_aware_route_altitude_profile_kernel`
- Kernel boundary: Deterministic conversion of WGS84 route branch points plus terrain elevation into AGL/MSL route profile records.
- Pure function expected: `yes` for the profile helper; `mixed` in Cesium rendering.
- Required input fields:
  - `route_branches` (`GeoJSON FeatureCollection`): Planned drone route branches. Units: `WGS84 coordinates`.
  - `default_altitude_agl_m` (`number`): Default planned route altitude from `demo_drone_route_default_altitude_agl_v1`. Units: `meters`.
  - `terrain_elevation_samples` (`array`): Terrain elevation samples or route-point elevation context. Units: `meters`.
- Optional input fields:
  - `drone_profile` (`object`): Demo drone speed, endurance, ceiling, sensor, and altitude limits. Units: `mixed`.
  - `terrain_source_ref` (`string`): Source id for terrain samples. Units: `id`.
  - `altitude_overrides` (`array`): Future per-waypoint or per-segment operator altitude overrides. Units: `meters_agl`.
- Derived fields: `terrain_elevation_m`, `altitude_agl_m`, `altitude_msl_m`, `terrain_status`, `terrain_source_ref`, `evidence_refs`, `warnings`
- Minimal valid example input:
```json
{
  "route_branches": {
    "type": "FeatureCollection",
    "features": []
  },
  "default_altitude_agl_m": 120,
  "terrain_elevation_samples": [
    {
      "lon": -121.84,
      "lat": 37.54,
      "elevation_m": 248
    }
  ]
}
```
- Example output summary:
```json
{
  "status": "passed",
  "route_point": {
    "terrain_elevation_m": 248,
    "altitude_agl_m": 120,
    "altitude_msl_m": 368,
    "terrain_status": "available",
    "evidence_refs": ["demo_drone_route_default_altitude_agl_v1"]
  }
}
```
- Current gaps / TODO notes:
  - Source module and tests do not exist yet.
  - Per-waypoint altitude editing is desired but out of scope for the first required implementation.

## `palantir_sunol_bundle_generator`
- Display name: Palantir Sunol Bundle Generator
- Category: `runtime`
- Stage order: `not_applicable`
- Purpose: Generate the offline Sunol / Pleasanton Ridge Palantir upload bundle from public geospatial sources and synthetic mission fixtures.
- When to call: For goal 0001 or when the team needs a clean uploadable AOI bundle for a restricted-network Palantir environment.
- When not to call: Do not call to operate real drones, certify terrain or utility safety, create strike workflows, or fetch private Palantir data.
- Input type: Fixed goal-0001 AOI configuration plus public OSM Overpass, CEC ArcGIS, HIFLD ArcGIS, and USGS EPQS endpoints. Endpoint URLs may be overridden with local environment variables.
- Output type: GeoJSON, CSV, Markdown, and `manifest.json` files under `resources/palantir_sunol_aoi_upload/`.
- Supported use cases: Offline Palantir upload preparation; public-source map context generation; synthetic ISR/recon mission fixture generation.
- Supported data or source families: OpenStreetMap Overpass context layers including roads, structures, natural features, vegetation/landcover, waterways, barriers, and power; CEC transmission FeatureServer; HIFLD transmission FeatureServer; USGS EPQS; synthetic mission fixtures.
- Status values: `generated | empty | source_error | partial_failure`
- Hard-fail vs warning behavior: Script execution fails only on unhandled runtime errors; individual source failures write empty source-error layers with manifest evidence.
- Formula or rule groups: `demo_terrain_attention_points_v1`
- Support level: `provisional`
- Platform support: `local_node`
- Required binaries or services: Node.js with network access to public endpoints.
- Headless expectations: Runs headlessly with `node scripts/generate-palantir-bundle.mjs`.
- Degraded modes: Overpass mirror fallback; ArcGIS JSON-to-GeoJSON fallback; empty source-error layers when all attempts fail; EPQS partial-failure manifest entries.
- Source module: `scripts/generate-palantir-bundle.mjs`
- Kernel id: `palantir_sunol_bundle_generator_kernel`
- Kernel boundary: Deterministic fixture generation plus best-effort live public source normalization into WGS84 artifacts.
- Pure function expected: `mixed`
- Required input fields:
  - `AOI bbox` (`object`): Sunol Ridge Training Area west/south/east/north from goal 0001. Units: `WGS84 decimal degrees`.
- Optional input fields:
  - `PALANTIR_BUNDLE_OVERPASS_URL` (`string`): Override for primary Overpass endpoint. Units: `URL`.
  - `PALANTIR_BUNDLE_OVERPASS_MIRROR_URL` (`string`): Override for Overpass fallback endpoint. Units: `URL`.
  - `PALANTIR_BUNDLE_CEC_TRANSMISSION_URL` (`string`): Override for CEC query endpoint. Units: `URL`.
  - `PALANTIR_BUNDLE_HIFLD_TRANSMISSION_URL` (`string`): Override for HIFLD query endpoint. Units: `URL`.
  - `PALANTIR_BUNDLE_USGS_EPQS_URL` (`string`): Override for EPQS endpoint. Units: `URL`.
- Derived fields: `source_health`, layer counts, provenance, retrieval timestamp, safety scope.
- Minimal valid example input:
```json
{
  "aoi": {
    "west": -121.9,
    "south": 37.48,
    "east": -121.74,
    "north": 37.6
  }
}
```
- Example output summary:
```json
{
  "status": "generated",
  "output_root": "resources/palantir_sunol_aoi_upload",
  "manifest": "resources/palantir_sunol_aoi_upload/manifest.json"
}
```
- Current gaps / TODO notes:
  - Public source freshness and exact Palantir import behavior remain provisional.

## `palantir_sunol_bundle_validator`
- Display name: Palantir Sunol Bundle Validator
- Category: `validation`
- Stage order: `not_applicable`
- Purpose: Validate that the generated Palantir upload bundle is parseable, complete, provenance-bearing, and free of obvious local-path or conflict-marker leakage.
- When to call: After generating or changing `resources/palantir_sunol_aoi_upload/`.
- When not to call: Do not use as a substitute for Palantir import testing, source freshness validation, or operational geospatial safety checks.
- Input type: `resources/palantir_sunol_aoi_upload/manifest.json` and required bundle files.
- Output type: CLI pass/fail result with layer counts and validation errors.
- Supported use cases: Goal 0001 verification; pre-upload artifact hygiene; handoff safety check.
- Supported data or source families: Generated GeoJSON, CSV, Markdown, and manifest artifacts.
- Status values: `passed | failed`
- Hard-fail vs warning behavior: Missing files, invalid JSON/GeoJSON, missing CSV headers, missing provenance fields, local paths, instance-specific upload URLs, or conflict markers fail validation.
- Formula or rule groups: `not_applicable`
- Support level: `provisional`
- Platform support: `local_node`
- Required binaries or services: Node.js; no network required.
- Headless expectations: Runs headlessly with `node scripts/validate-palantir-bundle.mjs`.
- Degraded modes: None.
- Source module: `scripts/validate-palantir-bundle.mjs`
- Kernel id: `palantir_sunol_bundle_validator_kernel`
- Kernel boundary: Local deterministic artifact validation.
- Pure function expected: `yes`
- Required input fields:
  - `manifest.json` (`object`): Bundle manifest with layer paths, counts, source names, source URLs, retrieval timestamps, and statuses. Units: `JSON`.
- Optional input fields:
  - `not_applicable` (`not_applicable`): No optional runtime inputs. Units: `not_applicable`.
- Derived fields: validation errors, layer counts.
- Minimal valid example input:
```json
{
  "manifest": "resources/palantir_sunol_aoi_upload/manifest.json"
}
```
- Example output summary:
```json
{
  "status": "passed",
  "summary": "Palantir bundle validation passed."
}
```
- Current gaps / TODO notes:
  - Does not validate Palantir account permissions, external source freshness, geometry topology, or operational terrain correctness.

## `mission_data_provider_runtime`
- Display name: Mission Data Provider Runtime
- Category: `runtime`
- Stage order: `0`
- Purpose: Load AOI-scoped mission layers for the planner from Foundry when available, otherwise from the static Goal 0001 bundle or built-in placeholder geometry.
- When to call: At planner startup and when the operator changes the provider selector.
- When not to call: Do not use for writeback, Palantir Actions, real drone control, MAVLINK/GCS, or hardware-control workflows.
- Input type: Preferred provider mode plus optional Foundry adapter, bearer token, or static bundle path.
- Output type: `MissionData` containing grouped WGS84 GeoJSON mission layers, provider status, safety scope, and source manifest entries.
- Supported use cases: Foundry-hosted app data access; local fallback; Cesium layer rendering.
- Supported data or source families: Foundry Functions REST; Foundry OSDK adapter; Goal 0001 static GeoJSON/CSV bundle; built-in synthetic placeholder geometry.
- Status values: `ready | partial | missing | unavailable`
- Hard-fail vs warning behavior: Missing Foundry adapter or static bundle degrades to placeholder geometry with a visible notice; malformed loaded data should surface as a warning or error.
- Formula or rule groups: `none`
- Support level: `provisional`
- Platform support: `Foundry-hosted adapter optional; local Vite fallback supported; read-only Functions REST supported with runtime bearer token`
- Required binaries or services: `node`, `npm`; Foundry auth only when using the Foundry path.
- Headless expectations: Provider selection and static fallback are unit-testable without a browser.
- Degraded modes: Static bundle fallback; built-in placeholder Sunol mission geometry; missing direct Foundry neutral context layers until OSDK/direct functions are added.
- Source module: `src/data/loadMissionData.ts`
- Kernel id: `mission_data_provider_runtime`
- Kernel boundary: Provider selection and mission layer grouping; Cesium rendering is separate.
- Pure function expected: `mixed`
- Required input fields:
  - `preferredProvider` (`enum(auto, foundry, static)`): Requested provider path. Units: `enum`.
- Optional input fields:
  - `basePath` (`string`): Static bundle root. Units: `path`.
  - `fetcher` (`function`): Fetch implementation for tests or runtime. Units: `function`.
  - `window.__FOUNDRY_MISSION_PROVIDER__` (`object`): Foundry-hosted adapter injected by generated OSDK setup. Units: `object`.
  - `window.__FOUNDRY_BEARER_TOKEN__` / `localStorage.foundryBearerToken` / `VITE_FOUNDRY_BEARER_TOKEN` (`string`): Runtime bearer token for read-only Functions REST. Units: `secret_token`.
- Derived fields: `provider`, `status`, `notices`, `layers`, `safetyScope`, `sources`
- Minimal valid example input:
```json
{
  "preferredProvider": "auto"
}
```
- Example output summary:
```json
{
  "provider": "placeholder",
  "status": "missing",
  "layers": 9
}
```
- Current gaps / TODO notes:
  - Neutral context object geometries from `RoadOrPath`, `Building`, and `NaturalFeature` need OSDK/direct-query support or additional Functions wrappers.
  - Writeback/actions are intentionally deferred; the current UI logs previews locally only.

## `rebuild_planner_runtime`
- Display name: Rebuild Planner Runtime
- Category: `runtime`
- Stage order: `0`
- Purpose: Provide a local Next.js backend for tactical launch-package authoring, Palantir/local mission bootstrap, SQLite persistence, simulation controls, PPS decision-zone handling, audit logs, and clickstream debugging.
- When to call: When the operator opens `apps/rebuild-planner`, creates or edits launch packages, places waypoints or decision target zones, starts simulation, steps playback, or simulates 1/2/4/8 PPS.
- When not to call: Do not call for real drone control, MAVLINK/GCS, hardware integration, autonomous targeting, kinetic workflows, or Palantir writeback until Foundry Actions are explicitly added.
- Input type: Browser UI actions plus optional server-side Foundry token and local Sunol fallback resources.
- Output type: Mission bootstrap payloads, persisted launch packages, simulation records, validation warnings, audit events, and debug clickstream records.
- Supported use cases: Tactical field-planning demo; DroneDeploy-like waypoint authoring; launch-package rehearsal; simulated PPS branch selection.
- Supported data or source families: Palantir Functions REST read path; local `resources/palantir_sunol_aoi_upload`; operator-authored local SQLite records.
- Status values: `draft | paused | playing | complete | warning | blocked`
- Hard-fail vs warning behavior: Missing Palantir auth falls back to local Sunol data in auto mode; explicit Palantir mode without a token fails visibly; invalid PPS logs a rejection and does not change simulation state.
- Formula or rule groups: `demo_launch_package_pps_branch_mapping_v2`
- Support level: `provisional`
- Platform support: `local Next.js; SQLite; Cesium Direct client map`
- Required binaries or services: `node`, `npm`; optional Foundry bearer token; no hardware services.
- Headless expectations: PPS grammar, compile warnings, and core API state transitions should be testable without Cesium.
- Degraded modes: Local Sunol fallback; HTML map overlay remains testable if Cesium assets fail to load.
- Source module: `apps/rebuild-planner`
- Kernel id: `rebuild_planner_runtime`
- Kernel boundary: Local backend state machine and PPS interpreter; Cesium rendering and UI clicks are mixed runtime behavior.
- Pure function expected: `mixed`
- Required input fields:
  - `missionId` (`string`): Mission context identifier. Units: `id`.
  - `packageId` (`string`): Launch package identifier for authoring and simulation actions. Units: `id`.
  - `waypoint behavior` (`enum`): Launch, transit, scout, scan area, observe, hold, decision, RTB, recover, or abort. Units: `enum`.
  - `lon` / `lat` (`number`): WGS84 placement coordinates. Units: `decimal_degrees`.
  - `observedPps` (`number`): Simulated PPS value. Units: `pulses_per_second`.
- Optional input fields:
  - `FOUNDRY_BEARER_TOKEN` (`string`): Server-side token for Palantir reads. Units: `secret_token`.
  - `x-foundry-token` (`string`): Local dev fallback token header. Units: `secret_token`.
  - `decisionPointId` / `targetZoneId` (`string`): Selected simulation context identifiers. Units: `id`.
- Derived fields: active simulation state, active branch type, validation warnings, audit log entries, clickstream events.
- Minimal valid example input:
```json
{
  "packageId": "pkg_123",
  "waypoint": {
    "behavior": "decision",
    "lon": -121.842,
    "lat": 37.538
  }
}
```
- Example output summary:
```json
{
  "status": "paused",
  "activeDecisionPointId": "decision_123",
  "auditLog": ["4 PPS accepted: primary route selected."]
}
```
- Current gaps / TODO notes:
  - Palantir write actions are intentionally not implemented.
  - Polygon target zones and full branch drawing are deferred.

## `mission_run_rehearsal_runtime`
- Display name: Mission Run Rehearsal Runtime
- Category: `runtime`
- Stage order: `4`
- Purpose: Separate editable Plan Mission state from immutable Run Mission rehearsal snapshots, named time jumps, PPS cue previews, operator confirmations, and audit-style run logs.
- When to call: When the operator switches into Run Mission mode, refreshes a run snapshot, jumps to a named demo beat, simulates a PPS cue, or confirms/clears a preview.
- When not to call: Do not call for real drone execution, hardware command, MAVLINK/GCS export, autonomous operational command, strike, engage, or target-selection workflows.
- Input type: Current `MissionData`, operator-selected timeline beat, and optional `PpsCuePreviewResult`.
- Output type: `EditablePlanState`, `RunMissionSnapshot`, `RunLogEntry`, and local cue decision state records for UI display.
- Supported use cases: Judge demo rehearsal, timeline fast-forward, state-machine outline preview, PPS route preview, local operator confirmation log.
- Supported data or source families: Foundry/static/placeholder `MissionData` from `mission_data_provider_runtime`.
- Status values: `plan | run`
- Hard-fail vs warning behavior: Missing mission data degrades to placeholder plan state; run mode remains simulation-only.
- Formula or rule groups: `demo_optical_cue_pps_command_mapping_v1` when cue previews are logged.
- Support level: `provisional`
- Platform support: `local Vite; Foundry-hosted UI compatible`
- Required binaries or services: `node`, `npm`
- Headless expectations: Snapshot and timeline helpers are unit-testable without Cesium or Palantir.
- Degraded modes: Built-in placeholder plan and timeline.
- Source module: `src/data/missionRun.ts`
- Kernel id: `mission_run_rehearsal_runtime`
- Kernel boundary: Deterministic creation of plan summaries, run snapshots, named timeline jumps, and log entries.
- Pure function expected: `yes` for data helpers; `mixed` in React UI.
- Required input fields:
  - `missionData` (`MissionData | null`): Current loaded mission layers and provider status. Units: `object`.
  - `mode` (`enum(plan, run)`): Active planner mode. Units: `enum`.
- Optional input fields:
  - `beatId` (`string`): Named timeline beat to jump to. Units: `id`.
- Derived fields: `runSnapshot`, `currentBeatId`, `log`, `warningCount`, `outline`, `cueDecision`
- Minimal valid example input:
```json
{
  "mode": "run",
  "beatId": "pps-cue"
}
```
- Example output summary:
```json
{
  "currentBeatId": "pps-cue",
  "logEntry": "Jumped rehearsal timeline to PPS Cue"
}
```
- Current gaps / TODO notes:
  - Timeline jumps do not yet drive Cesium animation.
  - Cue confirmations are local rehearsal log entries only; no server-side state mutation exists.

## Entry Template

## `[tool_or_stage_id]`
- Display name: `[Human Readable Name]`
- Category: `[pre_validation | selection | validation | runtime | review | maintenance]`
- Stage order: `[integer or not_applicable]`
- Purpose: `[what this stage does]`
- When to call: `[conditions where this stage should run]`
- When not to call: `[conditions where this stage should be skipped]`
- Input type: `[type, schema, or file path]`
- Output type: `[type, schema, or artifact set]`
- Supported use cases: `[list]`
- Supported data or source families: `[list]`
- Status values: `[passed | failed | skipped | warning | blocked]`
- Hard-fail vs warning behavior: `[what blocks progress and what only warns]`
- Formula or rule groups: `[ids from formula registry, if any]`
- Support level: `[validated | provisional | todo]`
- Platform support: `[not_applicable or platform notes]`
- Required binaries or services: `[none or list]`
- Headless expectations: `[not_applicable or behavior]`
- Degraded modes: `[none or list]`
- Source module: `[module or package path]`
- Kernel id: `[deterministic boundary id, if applicable]`
- Kernel boundary: `[what is pure, deterministic, or portable]`
- Pure function expected: `[yes | no | mixed]`
- Required input fields:
  - `[field]` (`[type]`): `[description]` Units: `[units]`.
- Optional input fields:
  - `[field]` (`[type]`): `[description]` Units: `[units]`.
- Derived fields: `[list]`
- Minimal valid example input:
```json
{
  "example": "replace with project-specific input"
}
```
- Example output summary:
```json
{
  "status": "passed",
  "summary": "replace with project-specific output"
}
```
- Current gaps / TODO notes:
  - `[known limitation]`

## Catalog Maintenance Rules
- Keep this Markdown file aligned with `docs/research/tool_interface_catalog.template.json` or the project-specific JSON catalog that replaces it.
- Add new public stages here before relying on them in agent workflows.
- Update examples when schemas change.
- Mark immature behavior as `provisional` or `todo`; do not present it as validated.
