# Codex CLI Goal Queue

This folder is the durable task queue for Codex CLI. Each goal is a standalone Markdown file with YAML front matter and enough context for the CLI to implement the task without needing chat history.

## How To Use
1. Read `AGENTS.md`.
2. Read `docs/PROJECT_CONTEXT.md` — includes **where each clarification lives** (*Documentation Map*) and **authoring vs simulated PPS** (*Clarified Product And Scope Contract*).
3. Read `docs/ROUNDTABLE_DEMO_REQUIREMENTS.md` — **Product principle** (planner first; demo derivative), **Decisions** (Plan/Run), **Open Questions**.
4. Before implementing **map UI, waypoints, routes, or cues**, read `docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md` (operator planning and symbology contract).
5. Scan numbered goal files matching `docs/goals/[0-9][0-9][0-9][0-9]-*.md` in filename order.
6. Pick the first goal with `status: "todo"`.
7. Set `status: "in_progress"` and `started_at`.
8. Implement only that goal.
9. Run the goal's verification commands.
10. If verification passes, commit and update the same goal file with:
    - `status: "done"`
    - `completed_at`
    - `commit_sha`
11. If blocked, set `status: "blocked"` and add blocker notes in the goal body.

## Status Values
- `todo`: ready to implement.
- `in_progress`: currently being implemented.
- `blocked`: cannot proceed without user input or unavailable resources.
- `done`: verified and complete.

## Queue Rules
- Process goals in filename order.
- Keep completed goal files in place.
- Do not edit `done` goals unless explicitly asked.
- Prefer one commit per goal.
- Do not commit secrets, local machine paths, caches, huge generated downloads, or credentials.
- If a goal introduces public tools, formula rules, workflow stages, or new evidence sources, update the corresponding registry in the same change.

## Current Initial Queue
1. `0001-palantir-offline-upload-bundle.md`
2. `0002-local-vite-cesium-planner-scaffold.md`
3. `0003-plan-mode-run-mission-mode.md`
4. `0004-mgrs-latlon-coordinate-display.md`
5. `0005-pps-cue-zones-and-route-preview.md`
6. `0006-isr-map-symbology-waypoint-glyphs-and-legend.md`
7. `0007-sidc-2525d-squad-land-units-svg-picker.md`

## Creating New Goals
Use `GOAL_TEMPLATE.md`, assign the next zero-padded numeric ID, and keep the goal small enough to finish in one focused Codex CLI run. `GOAL_TEMPLATE.md` is not an executable goal and must not be selected by Codex CLI.
