---
goal_id: "0004"
title: "MGRS And Lat/Lon Coordinate Display"
status: "done"
created_at: "2026-05-03T00:18:56Z"
started_at: "2026-05-03T06:57:53Z"
completed_at: "2026-05-03T07:22:14Z"
owner: "codex-cli"
commit_sha: "0504470427e867074786639d116c12099c352484"
---

# Goal
Add military grid coordinate support so the planner displays and translates between WGS84 Lat/Lon and MGRS.

## Read First
1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/ROUNDTABLE_DEMO_REQUIREMENTS.md`
4. `docs/goals/0002-local-vite-cesium-planner-scaffold.md`
5. `docs/goals/0003-plan-mode-run-mission-mode.md`

## Scope
Do:
- Add MGRS display for map cursor, selected objects, waypoints, cue zones, and decision panels.
- Add conversion helpers and focused tests.
- Keep WGS84 GeoJSON as the storage format.

Do not:
- Replace WGS84 storage with MGRS.
- Add complex coordinate systems beyond MGRS unless required for implementation.

## Implementation Requirements
- Use an npm MGRS conversion package unless a small reliable local implementation is clearly faster.
- Store geometry internally as WGS84 `[lon, lat, elevation?]`.
- Display:
  - decimal Lat/Lon
  - MGRS
  - elevation when available
- Add a coordinate utility module with:
  - Lat/Lon to MGRS
  - MGRS to Lat/Lon
  - formatting helpers for selected map objects
- Add UI surfaces:
  - cursor readout in status bar
  - selected object details panel
  - waypoint details panel
  - cue zone details panel
- Include validation behavior for invalid MGRS input if an input field is added.

## Verification
Run:
- `git diff --check`
- `npm run typecheck`
- `npm run build`
- coordinate conversion tests if a test runner exists

Expected:
- Selected objects show both Lat/Lon and MGRS.
- Round-trip conversion works within reasonable display precision.
- Invalid MGRS input does not crash the app.

## Completion Instructions
- Commit with message: `Add MGRS coordinate display`.
- Update this goal front matter with `status: "done"`, `completed_at`, and `commit_sha`.
- If blocked, set `status: "blocked"` and document exact blocker notes below.

## Final Report Requirements
Return:
- changed files
- verification results
- sample Sunol coordinate shown as Lat/Lon and MGRS
- commit SHA
- blockers or follow-up questions

## Blocker Notes
- None yet.
