# Rebuild Planner UI Test And Rework Plan

## Summary

Bring the rebuild planner up to the design docs by making launch packages, waypoints, and decision target zones fully editable, visible immediately after placement, and covered by exhaustive UI tests. Implementation should be test-first: add failing UI/API tests for each missing interaction, then rework the app until all pass.

## Key Changes

- Add full waypoint editing: select, rename, change behavior, objective, altitude, dwell time, lon/lat, delete, and resequence.
- Add package editing: rename, description/status edit, delete with confirmation when non-empty.
- Add decision target zone editing: immediate visibility after placement, selected details, radius/center/allowed PPS editing, delete, and PPS chips.
- Add backend update/delete routes for packages, waypoints, and DTZs.
- Rework the right rail so selected package, selected waypoint, selected DTZ, warnings, and simulation controls are integrated in one coherent panel.
- Keep Plan mode editable and Run mode inspection/simulation-only.

## Exhaustive UI Test Matrix

- Bootstrap/load: local fallback, Palantir fallback, explicit Palantir error.
- Package flows: create, expand/collapse, rename, delete empty, confirm delete non-empty, switch packages.
- Waypoint flows: place every behavior, select from map/list, edit fields, delete first/middle/last, resequence, delete decision waypoint, keep map draggable.
- DTZ flows: place, immediately select/show, edit radius/center/PPS values, delete, support multiple DTZs, preserve visibility.
- Mode behavior: Plan permits edits, Run locks edits, simulation state persists correctly.
- Simulation/PPS: start, pause, resume, step, reset, 1/2/4/8 PPS, invalid/no-zone/wrong-zone/outside-zone rejection.
- Visual checks: no default Cesium blue pins, correct glyphs, DTZ styling, no text overflow, usable rail.
- Debug/clickstream: log package, waypoint, DTZ, mode, simulation, PPS, and error events.

## Test Implementation

- Expand unit tests for PPS and geometry helpers.
- Expand component tests in `planner-shell.test.tsx`.
- Add API route tests for create/update/delete/resequence/compile/simulation.
- Add browser smoke tests for the full judge path.
- Completion gates:
  - `npm run test`
  - `npm run typecheck`
  - `npm run build`
  - screenshot confirming DTZ visibility and edit/delete controls.

## Assumptions

- Delete waypoint is Plan-mode only.
- Deleting a waypoint resequences automatically.
- Deleting a decision waypoint removes linked DTZ/branches for MVP and logs a warning.
- DTZ v1 remains circle-only.
- Palantir writeback remains out of scope; edits persist to local SQLite.
