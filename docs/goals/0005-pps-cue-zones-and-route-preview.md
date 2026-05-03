---
goal_id: "0005"
title: "PPS Decision Target Zones And Route Preview"
status: "done"
created_at: "2026-05-03T00:18:56Z"
started_at: "2026-05-03T07:47:48Z"
completed_at: "2026-05-03T08:31:51Z"
owner: "codex-cli"
commit_sha: "19ed192e4a82290bd26c067d26ecdc9a205aa49f"
---

# Goal

> 2026-05-03 alignment note: this completed goal predated the rebuild PRD terminology. Treat "cue zone" in the file path and old commit message as a legacy alias for **Decision Target Zone**.
Add simulated PEQ-15/PPS Decision Target Zones and command-preview behavior for route branch selection in the local planner.

## Read First
1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/ROUNDTABLE_DEMO_REQUIREMENTS.md`
4. `docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md` — **R7** preview vs commit; §10 PPS table; reuse symbology tokens from goal `0006` when available.
5. `docs/research/pps_drone_command_mapping_plan.md`
6. `docs/goals/0003-plan-mode-run-mission-mode.md`
7. `docs/goals/0004-mgrs-latlon-coordinate-display.md`

## Scope
Do:
- Render Decision Target Zones in 2D and 3D.
- Add simulated PPS cue preview behavior.
- Preview or select Primary, Alternate, Hold, and RTB commands according to the active Plan/Run workflow.
- Log cue events and operator confirmations in Run Mission Mode.

Do not:
- Implement real PEQ-15 hardware integration.
- Implement authentication/IFF.
- Implement real drone commands.
- Add kinetic, strike, engage, target-selection, or weapon-release workflows.

## Implementation Requirements
- Use the canonical Launch Package Simulation mapping from `docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md` §10:
  - `1 PPS`: hold/loiter
  - `2 PPS`: RTB
  - `4 PPS`: Primary route
  - `8 PPS`: Alternate route
- Decision Target Zones are ground polygons or circles with labels and MGRS/LatLon readouts.
- In 3D mode, show:
  - Decision Target Zone clamped to terrain
  - simulated line-of-sight ray from target zone to route decision point
  - text label like `Simulated PPS | 4 PPS | Primary route`
- Primary and Alternate are preplanned branches attached to a waypoint or route segment.
- In Plan mode, command previews stay non-committal. In Launch Package Simulation, a valid PPS event at the active Decision Target Zone applies the simulated branch/action immediately and writes an audit log.
- Unknown, no-pulse, or ambiguous cue input must not advance state; log a warning or ignored event.
- Branch and target-zone visuals must follow **R7** and share color/tokens with `docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md` / goal `0006` symbology module.
- Decision panel must show:
  - map zone
  - PPS value
  - matched command
  - route preview
  - rationale
  - warnings
  - accepted action or rejection reason
- Update tool/interface docs if this creates new public workflow stages beyond the already planned `optical_cue_interpreter_demo`.

## Verification
Run:
- `git diff --check`
- `npm run typecheck`
- `npm run build`
- cue mapping tests if a test runner exists

Expected:
- `4 PPS` selects Primary route in Launch Package Simulation and logs the event.
- `8 PPS` selects Alternate route in Launch Package Simulation and logs the event.
- `2 PPS` selects RTB in Launch Package Simulation and logs the event.
- Unknown cue input logs a warning and does not change route state.
- 2D and 3D views show Decision Target Zones and route preview/selection state.

## Completion Instructions
- Commit with message: `Add PPS cue zone route previews`.
- Update this goal front matter with `status: "done"`, `completed_at`, and `commit_sha`.
- If blocked, set `status: "blocked"` and document exact blocker notes below.

## Final Report Requirements
Return:
- changed files
- verification results
- sample cue event output
- commit SHA
- blockers or follow-up questions

## Blocker Notes
- None yet.
