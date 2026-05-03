---
goal_id: "0006"
title: "ISR Map Symbology Waypoint Glyphs And Legend"
status: "todo"
created_at: "2026-05-03T12:00:00Z"
started_at: null
completed_at: null
owner: "codex-cli"
commit_sha: null
---

# Goal

Implement **canonical map symbology** from `docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md` in the local Cesium planner: **route line grammar (R1/R2)**, **separate scan vs camera overlays (R4/R5)**, **behavior-aware waypoint markers (§8)**, and a **compact map legend** operators can read without opening docs.

## Read First

1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md` — **authoritative** §6 (R1–R7), §7–§8 (behaviors), §12 (implementation notes)
4. `docs/ROUNDTABLE_DEMO_REQUIREMENTS.md`
5. `docs/goals/0002-local-vite-cesium-planner-scaffold.md`

## Scope

Do:

- **Route semantics:** Apply **R1** (dotted yellow, ~50% opacity) for **unread / not-yet-executed** route segments and **R2** (solid yellow, ~50% opacity) for **tread / executed** segments wherever the app renders mission route polylines. Support toggling or demo fixtures that show both on one path.
- **Layer separation:** Implement **distinct Cesium primitives or style layers** for:
  - drone route (yellow, R1/R2),
  - **scan footprint / scan path** (non-yellow, §R5 — polygon, corridor, or ribbon),
  - **camera / sensor** hints (**light blue**, §R4 — FOV wedge, short LOS, or pan arc stub).
- **Waypoint markers:** For waypoint entities tied to a **behavior type**, render a **shared stem** plus **behavior-specific head** per §8 (minimum viable set: **Launch**, **Transit**, **Decision**, **Hold/loiter**, **RTB**, **Land**; extend to remaining rows in §8 if time permits). Use simple geometry (e.g. cylinders/boxes/billboards) — polish can follow.
- **Legend:** Add a **compact map-overlay legend** (corner card or collapsible panel) listing at least: Untread route, Tread route, Scan footprint, Camera/FOV, Decision preview (R7). Link or subtitle to “simulation / planning only” if not already in chrome.
- Centralize colors and opacity in **theme constants** or a small **symbology config module** so future goals (e.g. `0005`) import the same tokens.

Do not:

- Implement live drone control or hardware cue integration (preview-only semantics remain per roundtable).
- Replace goal `0005` — **PPS cue zones and branch preview logic** stay there; this goal provides **shared styling and waypoint vocabulary** that `0005` should consume.
- Block the app if full §8 coverage is incomplete; ship incremental glyphs behind a short comment in the goal completion notes.

## Implementation Requirements

- Reference **§12** for geometry storage (WGS84) and **preview** styling (**R7**) for any branch geometry present.
- **Preview** overlays (Route A/B, hold, RTB) must be visually **lighter or dashed** until confirmed when wired to mission state (coordinate with `0003` / `0005` when those exist).
- Add **developer-facing** `README` section or `docs/` pointer listing symbology module path and link back to `ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md`.

## Verification

Run:

- `git diff --check`
- `npm run typecheck`
- `npm run build`

Expected:

- Map shows **distinguishable** dotted vs solid yellow route styling on demo data.
- **Scan** and **camera** layers are **not** confused with yellow route (different color/material).
- At least **six** behavior types from §8 have distinguishable markers on the map.
- Legend visible in UI and matches R1/R2/R4/R5/R7 labels.
- No TypeScript or build regressions.

## Completion Instructions

- Commit with message: `feat: ISR map symbology legend and waypoint glyphs`.
- Update this goal front matter with `status: "done"`, `completed_at`, and `commit_sha`.
- If blocked, set `status: "blocked"` and document blocker notes below.

## Final Report Requirements

Return:

- changed files
- screenshot or short description of legend + sample markers
- verification results
- commit SHA
- any behaviors from §8 deferred to follow-up

## Blocker Notes

- None yet.
