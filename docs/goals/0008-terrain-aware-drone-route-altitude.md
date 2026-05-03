---
goal_id: "0008"
title: "Terrain-Aware Drone Route Altitude"
status: "todo"
created_at: "2026-05-03T06:05:32Z"
started_at: null
completed_at: null
owner: "codex-cli"
commit_sha: null
---

# Goal
Add terrain-aware altitude planning for drone route branches so the planner uses a default altitude above terrain and shows elevated flight paths in the Cesium 3D view.

## Read First
1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/ROUNDTABLE_DEMO_REQUIREMENTS.md`
4. `docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md`
5. `docs/research/moving_unit_drone_mission_planning.md`
6. `docs/research/formula_registry.json`
7. `docs/TOOL_INTERFACE_CATALOG.md`
8. `docs/goals/0002-local-vite-cesium-planner-scaffold.md`
9. `docs/goals/0003-plan-mode-run-mission-mode.md`
10. `docs/goals/0006-isr-map-symbology-waypoint-glyphs-and-legend.md`

## Scope
Do:
- Add a terrain-aware route altitude profile for drone route branches.
- Use `120 m AGL` as the default planned route altitude.
- Compute `altitude_msl_m` from terrain elevation plus planned AGL altitude when terrain elevation is available.
- Render drone route branches in the Cesium 3D view as visibly elevated flight paths above terrain.
- Show AGL/MSL altitude information in waypoint or selected-route details.
- Warn clearly when terrain data is missing, stale, too sparse, or otherwise insufficient for altitude planning.

Do not:
- Implement real drone control, MAVLINK/GCS export, autopilot upload, or certified flight safety logic.
- Treat fixture-backed or single-source terrain as authoritative obstacle clearance.
- Add kinetic, strike, engagement, target-selection, or weapon-release workflows.
- Require per-waypoint altitude editing for this goal; document it as a TODO/stretch item only.

## Implementation Requirements
- Add or extend a pure route-altitude profiling helper that accepts planned drone route geometry plus terrain samples/context and returns waypoint or segment records with:
  - `terrain_elevation_m`
  - `altitude_agl_m`
  - `altitude_msl_m`
  - `terrain_source_ref`
  - `terrain_status`
  - `evidence_refs`
- Use formula registry rule `demo_drone_route_default_altitude_agl_v1` for the default `120 m AGL` value.
- If terrain elevation is unavailable for a waypoint or segment, preserve route geometry but mark altitude planning as degraded and show a warning instead of silently using ground-level coordinates.
- Route geometry exposed to the app, bundle, or future API/function surfaces such as `getRouteBranches()` must be sufficient for elevated 3D rendering: either altitude-bearing coordinates or waypoint metadata that unambiguously provides AGL/MSL values.
- Future API/function surfaces must preserve source/provenance and validation/degraded status: `getMissionBundle()` should advertise altitude-profile support and source health, `getAoi()` should keep AOI provenance, and `getRouteBranches()` should expose altitude-aware route branch data.
- In Cesium 3D mode, route branches must render above terrain using computed MSL altitude where available and remain visually consistent with the canonical route symbology from goal `0006`.
- In 2D mode, existing route readability must remain intact; altitude details can appear in selected-object or waypoint panels rather than changing 2D line geometry.
- Add a TODO note in the relevant code or goal completion notes for editable per-waypoint altitude if time allows.

## Verification
Run:
- `git diff --check`
- `npm run typecheck`
- `npm run build`
- route-altitude profile tests if a test runner exists

Expected:
- Route branches include terrain elevation, default `120 m AGL`, computed MSL altitude, terrain source/provenance, and status fields.
- Cesium 3D view shows route branches elevated above terrain, not ground-clamped.
- Waypoint or selected-route details visibly expose `120 m AGL` and computed MSL where available.
- Missing or degraded terrain data creates a clear warning/status and does not crash the app.
- Existing 2D map behavior and route styling continue to work.

## Completion Instructions
- Commit with message: `Add terrain-aware route altitude planning`.
- Update this goal front matter with `status: "done"`, `completed_at`, and `commit_sha`.
- If blocked, set `status: "blocked"` and document exact blocker notes below.

## Final Report Requirements
Return:
- changed files
- verification results
- sample route waypoint showing AGL/MSL/terrain provenance
- screenshot or short description proving the 3D route is elevated
- commit SHA
- deferred per-waypoint altitude editing notes

## Blocker Notes
- None yet.

## TODO / Stretch
- Allow operators to edit altitude per waypoint or segment, with validation warnings when edits fall below the configured demo minimum or exceed the selected drone profile.
