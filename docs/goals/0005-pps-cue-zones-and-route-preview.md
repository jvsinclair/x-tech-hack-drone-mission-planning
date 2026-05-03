---
goal_id: "0005"
title: "PPS Cue Zones And Route Preview"
status: "in_progress"
created_at: "2026-05-03T00:18:56Z"
started_at: "2026-05-03T07:47:48Z"
completed_at: null
owner: "codex-cli"
commit_sha: null
---

# Goal
Add simulated PEQ-15/PPS cue zones and command-preview behavior for route branch selection in the local planner.

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
- Render cue zones in 2D and 3D.
- Add simulated PPS cue preview behavior.
- Preview Route A, Route B, Hold, and RTB commands.
- Log cue events and operator confirmations in Run Mission Mode.

Do not:
- Implement real PEQ-15 hardware integration.
- Implement authentication/IFF.
- Implement real drone commands.
- Add kinetic, strike, engage, target-selection, or weapon-release workflows.

## Implementation Requirements
- Use the provisional demo mapping:
  - `1 PPS`: hold/loiter preview
  - `2 PPS`: Route A preview
  - `4 PPS`: Route B preview
  - `8 PPS`: RTB preview
- Cue zones are ground polygons or circles with labels and MGRS/LatLon readouts.
- In 3D mode, show:
  - cue zone clamped to terrain
  - simulated line-of-sight ray from cue zone to route decision point
  - text label like `Simulated PEQ-15 cue | 4 PPS | Route B preview`
- Route A and Route B are preplanned branches attached to a waypoint or route segment.
- All command previews require human confirmation before advancing state.
- Unknown, no-pulse, or ambiguous cue input must not advance state; log a warning or ignored event.
- Branch and cue **preview** visuals must follow **R7** (provisional styling until confirm) and share color/tokens with `docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md` / goal `0006` symbology module.
- Decision panel must show:
  - map zone
  - PPS value
  - matched command
  - route preview
  - rationale
  - warnings
  - confirmation action
- Update tool/interface docs if this creates new public workflow stages beyond the already planned `optical_cue_interpreter_demo`.

## Verification
Run:
- `git diff --check`
- `npm run typecheck`
- `npm run build`
- cue mapping tests if a test runner exists

Expected:
- `4 PPS` previews Route B and does not advance without confirmation.
- `8 PPS` previews RTB and requires confirmation or explicit acknowledgement.
- Unknown cue input logs a warning and does not change route state.
- 2D and 3D views show cue zones and route preview.

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
