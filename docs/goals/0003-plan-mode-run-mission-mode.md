---
goal_id: "0003"
title: "Plan Mode And Run Mission Mode"
status: "done"
created_at: "2026-05-03T00:18:56Z"
started_at: "2026-05-03T03:00:39Z"
completed_at: "2026-05-03T03:10:51Z"
owner: "codex-cli"
commit_sha: "7ccd2c31e0cbddcbe24a49c81f4b0a798e842350"
---

# Goal
Add explicit Plan Mode and Run Mission Mode to the local planner app.

## Read First
1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/ROUNDTABLE_DEMO_REQUIREMENTS.md`
4. `docs/goals/0002-local-vite-cesium-planner-scaffold.md`

## Scope
Do:
- Add a global mode switch for `Plan Mission` and `Run Mission`.
- Add mission state containers for editable plan state and immutable run snapshots.
- Add the first timeline/run-log shell for the judge demo path.

Do not:
- Add real drone execution.
- Add live Palantir SDK integration.
- Add final PPS cue behavior; that is covered by goal `0005`.

## Implementation Requirements
- Plan Mode:
  - editing controls are enabled
  - layer toggles remain visible
  - selected waypoint/route/cue-zone panels support future edits
  - route distance, warnings, and state-machine outline can be displayed from fixture data
- Run Mission Mode:
  - creates a snapshot of the current plan
  - disables direct mission editing while the run is active
  - shows timeline controls and named time jumps
  - logs state transitions and operator decisions
- Include named time-jump placeholders:
  - `Launch`
  - `Route Start`
  - `Terrain Warning`
  - `Target Identification`
  - `PPS Cue`
  - `Route Branch Preview`
  - `RTB`
- Add clear UI copy that Run Mission Mode is an app-side simulation/rehearsal, not real drone control.

## Verification
Run:
- `git diff --check`
- `npm run test`
- `npm run typecheck`
- `npm run build`

Expected:
- Mode switch works.
- Unit tests pass.
- Run Mission creates a snapshot and locks editing.
- Returning to Plan Mode restores editing.
- Timeline shell renders named demo beats.

## Completion Instructions
- Commit with message: `Add plan and run mission modes`.
- Update this goal front matter with `status: "done"`, `completed_at`, and `commit_sha`.
- If blocked, set `status: "blocked"` and document exact blocker notes below.

## Final Report Requirements
Return:
- changed files
- verification results
- screenshots or concise UI summary if available
- commit SHA
- blockers or follow-up questions

## Blocker Notes
- None yet.
