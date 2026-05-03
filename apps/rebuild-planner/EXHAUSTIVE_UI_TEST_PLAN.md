# Rebuild Planner UI: Exhaustive Test & Rework Plan

## Status Tracker

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Test Infrastructure Hardening | DONE |
| 1 | Waypoint Editing | DONE |
| 2 | Waypoint Deletion | DONE |
| 3 | Waypoint Resequencing | DONE |
| 4 | Package Rename & Deletion | DONE |
| 5 | DTZ Editing & Deletion | DONE |
| 6 | Mode Behavior (Plan vs Run Locking) | DONE |
| 7 | Enhanced Simulation & PPS Coverage | DONE |
| 8 | Visual & Rendering Correctness | CORE COVERED |
| 9 | Debug Clickstream Coverage | DONE |
| 10 | Edge Cases & Regression Guards | CORE COVERED |

---

## Context

The rebuild-planner (`apps/rebuild-planner/`) is an MVP Next.js tactical drone mission planner. Core workflows (bootstrap, waypoint placement, DTZ placement, simulation, PPS branching) are wired end-to-end, but the UI is unstable because **most CRUD operations beyond "create" are missing** -- there are no edit, delete, rename, or resequence capabilities. The `SelectionBlock` is read-only, there's no confirmation UX for destructive actions, and mode-locking (Plan editable / Run read-only) isn't enforced on the new controls that need to be added.

The plan document (`docs/rebuild-planner-ui-test-and-rework-plan.md`) defines the target: full waypoint/package/DTZ editing, test-first methodology, and exhaustive coverage. This plan implements that vision in 10 ordered phases.

---

## Phase 0: Test Infrastructure Hardening

**Goal:** Make the mock layer extensible for all upcoming CRUD tests.

- **Create `tests/fixtures.ts`** -- extract `packageFixture()`, `simulationFixture()`, `bootstrapFixture()`, `emptyLayer` from `planner-shell.test.tsx`
- **Create `tests/mock-api.ts`** -- extract `fetchMock()` and `json()` into a configurable dispatch table with mutable `currentPackage`, `currentSimulation`, `packages[]` state and `resetMockState()`. Expose route handler registration so new test files add PATCH/DELETE handlers without duplicating the base mock.
- **Update `tests/planner-shell.test.tsx`** to import from shared modules. Verify all 5 existing tests still pass.

Files: `tests/fixtures.ts` (new), `tests/mock-api.ts` (new), `tests/planner-shell.test.tsx` (refactor)

---

## Phase 1: Waypoint Editing

**Tests first** (`tests/waypoint-crud.test.tsx`, new):
1. `renders edit form when waypoint selected in Plan mode` -- assert input fields for name, altitude, dwell, behavior, objective, lat, lon
2. `submits edited waypoint name and updates the list` -- PATCH intercept, body check
3. `submits edited altitude and dwell fields`
4. `submits edited behavior dropdown`
5. `submits edited lat/lon coordinates`
6. `does not show edit form in Run mode`

**Backend:**
- `repository.ts` -- add `updateWaypoint({ waypointId, packageId, name?, behavior?, objective?, altitudeM?, dwellSeconds?, lon?, lat? })`
- New file: `src/app/api/launch-packages/[packageId]/waypoints/[waypointId]/route.ts` -- `PATCH` handler

**UI:**
- Replace read-only `SelectionBlock` with `EditableSelectionBlock` that renders `<input>` fields in Plan mode, read-only display in Run mode, plus a Save button
- Add `handleUpdateWaypoint()` to PlannerShell

---

## Phase 2: Waypoint Deletion

**Tests first** (append to `tests/waypoint-crud.test.tsx`):
1. `shows delete button for selected waypoint in Plan mode`
2. `deletes waypoint and removes it from list`
3. `deleting first waypoint resequences the rest`
4. `deleting last waypoint leaves others unchanged`
5. `deleting decision waypoint also removes linked DTZ` -- cascade
6. `does not show delete button in Run mode`

**Backend:**
- `repository.ts` -- add `deleteWaypoint({ waypointId, packageId })` with auto-resequence and decision cascade
- Same route file: add `DELETE` handler

**UI:**
- Add "Delete waypoint" button (aria-label) in edit block, Plan mode only
- `handleDeleteWaypoint()` clears selection after delete

---

## Phase 3: Waypoint Resequencing

**Tests first** (append to `tests/waypoint-crud.test.tsx`):
1. `shows move-up/move-down buttons in waypoint list`
2. `moving waypoint down swaps with next`
3. `moving waypoint up swaps with previous`

**Backend:**
- `repository.ts` -- add `reorderWaypoints({ packageId, waypointIds[] })`
- New file: `src/app/api/launch-packages/[packageId]/waypoints/resequence/route.ts` -- `POST`

**UI:**
- Add move-up/move-down buttons in `WaypointList`, Plan mode only
- `handleResequence()` in PlannerShell

---

## Phase 4: Package Rename & Deletion

**Tests first** (`tests/package-crud.test.tsx`, new):
1. `shows rename input on double-click, saves on Enter`
2. `shows delete button on each package row`
3. `deletes empty package immediately`
4. `shows confirmation dialog before deleting non-empty package`
5. `cancelling delete does not delete`
6. `switching packages changes waypoint list`
7. `creating new package expands it automatically`

**Backend:**
- `repository.ts` -- add `updatePackage({ packageId, name?, description?, status? })` and `deletePackage(packageId)`
- New file: `src/app/api/launch-packages/[packageId]/route.ts` -- `PATCH` and `DELETE`

**UI:**
- Inline rename on double-click of package name
- Delete button per package row with confirmation state (`pendingDeleteId`)
- On delete: clear from `packages`, set `expandedPackageId` to next available

---

## Phase 5: DTZ Editing & Deletion

**Tests first** (`tests/dtz-crud.test.tsx`, new):
1. `shows edit form when DTZ selected in Plan mode` -- radius, center lat/lon, allowed PPS checkboxes
2. `submits edited radius`
3. `submits edited center coordinates`
4. `submits edited allowed PPS values`
5. `does not show edit form in Run mode`
6. `shows delete button for selected DTZ`
7. `deletes DTZ and removes from map`
8. `placing DTZ immediately selects and shows edit form`
9. `multiple DTZs independently selectable`

**Backend:**
- `repository.ts` -- add `updateDecisionZone({ zoneId, packageId, ... })` and `deleteDecisionZone({ zoneId, packageId })`
- New file: `src/app/api/launch-packages/[packageId]/decision-zones/[zoneId]/route.ts` -- `PATCH` and `DELETE`

**UI:**
- Extend `EditableSelectionBlock` for zone editing: radius input, center lat/lon, PPS checkboxes, Save/Delete buttons
- `handleUpdateZone()` and `handleDeleteZone()` in PlannerShell

---

## Phase 6: Mode Behavior (Plan vs Run Locking)

**Tests first** (`tests/mode-behavior.test.tsx`, new):
1. `Plan mode shows palette and editing controls`
2. `Run mode hides palette and disables editing`
3. `Run mode shows simulation controls`
4. `switching Run→Plan restores editing UI`
5. `simulation state persists across mode switches`

**Implementation:** Ensure all edit/delete buttons from Phases 1-5 conditionally render `mode === "plan"`. Pass `mode` to `WaypointList` and `EditableSelectionBlock`.

---

## Phase 7: Enhanced Simulation & PPS Coverage

**Tests first** (`tests/simulation-flow.test.tsx`, new):
1. `starts paused at WP 1 with empty audit log`
2. `step advances to next waypoint`
3. `pause after resume changes status`
4. `reset returns to WP 1`
5. `step to decision waypoint pauses with decision message`
6-9. `PPS 1/2/4/8 selects correct branch`
10. `rejects unsupported PPS`
11. `rejects when no zone exists`

**Also append to `tests/pps.test.ts`:**
- `rejects when no active decision point`
- `rejects when zone mismatches active decision`
- `rejects when PPS not in zone's allowedPps`

---

## Phase 8: Visual & Rendering Correctness

**Tests first** (`tests/visual-correctness.test.tsx`, new):
1. `renders WaypointGlyph SVG, not default blue pins`
2. `renders correct glyph per behavior type`
3. `DTZ markers have zone styling`
4. `selected waypoint has selected class`
5. `selected DTZ has selected class`
6. `long waypoint names truncated (no overflow)`
7. `planner rail is scrollable when content overflows`

**Implementation:** CSS fixes if any tests fail.

---

## Phase 9: Debug Clickstream Coverage

**Tests first** (`tests/clickstream.test.tsx`, new):
1-10. Assert `POST /api/debug/clickstream` fires for: create package, place waypoint, select waypoint, select zone, mode toggle, package expand, waypoint edit, waypoint delete, package rename, DTZ edit

**Implementation:** Add `recordUi()` calls in each new handler from Phases 1-5.

---

## Phase 10: Edge Cases & Regression Guards

**Tests first** (`tests/edge-cases.test.tsx`, new):
1. `empty package shows empty state message`
2. `rapid double-click doesn't duplicate waypoints`
3. `switching packages clears selection`
4. `deleting selected waypoint clears selection`
5. `deleting only package shows empty state`
6. `map drag still works after place+delete`
7. `bootstrap error shows error status`

**Implementation:** Defensive guards in PlannerShell.

---

## Summary

| Phase | New Tests | New API Routes | New Repo Functions | UI Changes |
|-------|-----------|----------------|-------------------|------------|
| 0 | 0 (refactor) | 0 | 0 | 0 |
| 1 | 6 | PATCH waypoint | updateWaypoint | Edit form |
| 2 | 6 | DELETE waypoint | deleteWaypoint | Delete button |
| 3 | 3 | POST resequence | reorderWaypoints | Move buttons |
| 4 | 7 | PATCH/DELETE package | updatePackage, deletePackage | Rename, delete, confirm |
| 5 | 9 | PATCH/DELETE zone | updateDecisionZone, deleteDecisionZone | Zone edit form |
| 6 | 5 | 0 | 0 | Mode gating |
| 7 | 14 | 0 | 0 | Mock enrichment |
| 8 | 7 | 0 | 0 | CSS fixes |
| 9 | 10 | 0 | 0 | recordUi calls |
| 10 | 7 | 0 | 0 | Defensive guards |

**Total: ~74 new tests, 3 new route files, 7 new repository functions**

### 2026-05-03 Implementation Update

- Current verification: `npm run test` passes with 76 tests across 10 test files; `npm run typecheck` passes; `npm run build` passes after stopping the port 3001 dev server to release the Prisma DLL lock.
- Implemented local server mutations for package, waypoint, resequence, and DTZ edit/delete flows.
- Added clickstream assertions for package create/expand/rename, waypoint placement/select/edit/delete, zone select/edit/delete, and mode toggles.
- Hardened map placement so the placement tool disarms after a waypoint or DTZ is placed; the map remains draggable afterward.
- Hardened server-side resequencing with a two-pass transaction to avoid SQLite unique-key collisions on `(packageId, sequence)`.
- Remaining visual coverage is component-level, not pixel/screenshot-based. Add browser screenshot regression coverage before treating Phase 8 as fully exhaustive.

## Critical Files

- `apps/rebuild-planner/src/components/PlannerShell.tsx` -- main UI shell (most changes)
- `apps/rebuild-planner/src/lib/server/repository.ts` -- all 7 new mutation functions
- `apps/rebuild-planner/src/app/api/launch-packages/[packageId]/waypoints/[waypointId]/route.ts` (new)
- `apps/rebuild-planner/src/app/api/launch-packages/[packageId]/route.ts` (new)
- `apps/rebuild-planner/src/app/api/launch-packages/[packageId]/decision-zones/[zoneId]/route.ts` (new)
- `apps/rebuild-planner/src/app/api/launch-packages/[packageId]/waypoints/resequence/route.ts` (new)
- `apps/rebuild-planner/tests/planner-shell.test.tsx` (refactor mock infra)
- `apps/rebuild-planner/tests/fixtures.ts` (new)
- `apps/rebuild-planner/tests/mock-api.ts` (new)

## Verification (after each phase)

```bash
cd apps/rebuild-planner
npm test              # vitest run --pool=vmThreads --maxWorkers=2
npm run typecheck     # tsc --noEmit
npm run build         # next build
npm run dev           # manual smoke test at localhost:3001
```
