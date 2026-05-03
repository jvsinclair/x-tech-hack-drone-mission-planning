---
goal_id: "0003"
title: "Plan Mode And Run Mission Mode"
status: "todo"
created_at: "2026-05-03T00:18:56Z"
started_at: null
completed_at: null
owner: "codex-cli"
commit_sha: null
---

# Goal
Add explicit **Plan Mode** and **Run Mission Mode** to the local planner app, with behavior and UX aligned to **`docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md`** (especially §5 Plan vs Run, §6 global map rules **R1–R7**, §11 MVP supplements) and **`docs/ROUNDTABLE_DEMO_REQUIREMENTS.md`** (waypoint mapper, judge path, audit logging).

Plan Mode must support **authoring a mission from scratch** (empty or loaded baseline), not only rehearsing a canned fixture: operators place and edit topology; Run Mode snapshots that topology for simulation/rehearsal.

**Where consolidated clarifications live:** Repo-wide **documentation map**, **goal slice table**, and **authoring vs PPS scope** narrative — **`docs/PROJECT_CONTEXT.md`** (*Documentation Map*, *Clarified Product And Scope Contract*). **Resolved Plan/Run decisions** (from-scratch bar, Run lock, R1/R2 2D/3D, symbology gate, etc.) are in **`docs/ROUNDTABLE_DEMO_REQUIREMENTS.md`** (*Decisions: Plan Mode, Run Mission Mode, And Product Shape*). Remaining **open questions** are in the same file (*Open Questions*).

## Read First
1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/ROUNDTABLE_DEMO_REQUIREMENTS.md`
4. **`docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md`** — §5 Plan vs Run; §6 **R1–R7** (route tread vs untread, preview vs commit); §8 behavior catalog (headline intent); §11 selection, undo, regeneration, empty states; §12 dev notes (`preview` flag, layer separation).
5. `docs/STATE_DECISION_GRAPH.md` — topology vs outline vs runtime; event → guard → action; recompile on edit.
6. `docs/goals/0002-local-vite-cesium-planner-scaffold.md`
7. `docs/goals/0006-isr-map-symbology-waypoint-glyphs-and-legend.md` — **read for sequencing**: full waypoint glyph/legend implementation may land in `0006`; this goal still defines mode behavior, data shape for `preview`, and panel/queue wiring so `0005`/`0006` can plug in without rework.

## Scope
Do:
- Add a global mode switch for **`Plan Mission`** and **`Run Mission`** (copy: Run is **app-side simulation/rehearsal**, not real drone control — see roundtable).
- Add mission state containers: **editable plan state** in Plan; **immutable run snapshot** created when entering Run (undo stack or “reset run” can be a follow-up; at minimum, snapshot at transition).
- **Authoring (Plan):** support a **from-scratch** path consistent with roundtable “Waypoint Mapper”:
  - place or confirm **launch** (start of ordered track);
  - add **ordered waypoints** (e.g. map click / queue) and **drag** to adjust;
  - **select** waypoint, segment, or (when present) branch/cue context — selection drives the **side panel** (maneuver **4** = parameters/semantics per iconography §4);
  - show an **SC2-style outline / queue** of mission steps that stays in sync with map selection and order;
  - on edit, **recompute visibly**: distance (and placeholders for time/battery/range if not yet modeled), **validation warnings**, **state-machine outline**, and **timeline** placeholders — matching roundtable judge promise (“change something → outline and timeline update”).
- **Run:** disable or strongly gate **direct geometry edits** while run is active; advance **timeline** and named beats; **log** transitions and operator confirmations per roundtable audit list (cue event, route preview, operator choice, validation warning, state transition, regeneration after Plan edits when returning to Plan).
- Layer toggles and context layers remain available per scaffold; in Plan, editing controls enabled; in Run, emphasis on playback/logging — **R1/R2** semantics for route display (dotted = untread / ahead, solid = tread / behind or committed leg — define precisely in UI doc string or comment when implementing).
- Add the first **timeline / run-log shell** for the judge demo path; align beat **names** with `docs/STATE_DECISION_GRAPH.md` / roundtable where possible (below placeholders can be renamed if the graph supersedes them — **see Roundtable questions**).
- **Empty / error states** per iconography §11: no mission, no selection, invalid plan for Run — clear operator messaging.

Do not:
- Add real drone execution or live GCS export.
- Add live Palantir SDK integration (goal `0001` / separate track).
- Implement **simulated PPS cue zones**, **branch preview styling polish**, or **full PEQ-15 demo wiring** — goal **`0005`** (still wire **data flags** for `preview` vs committed so **`0005`**/`0006` attach cleanly — iconography **R7**, §12 `preview: true`).
- Replace goal **`0006`** — do not treat this goal as the full symbology/legend deliverable; use minimal placeholders if needed, but keep **layer separation** (route vs scan vs sensor) consistent with iconography §12.

## Implementation Requirements

### Plan Mode
- Editing enabled; **regeneration feedback** after edits (outline, distances, warnings update visibly — iconography §11.3).
- **Selection model:** selected entity type (waypoint, segment, fixation, freedraw when present) drives the parameter panel (§11.1); document in code or `TOOL_INTERFACE_CATALOG.md` if new surfaces appear.
- Support **fixture load** and/or **new mission** so judges are not locked to one canned path (exact import shape follows scaffold/fixtures).
- Route distance, warnings, and state-machine outline: **fixture-backed or computed stubs** acceptable if formulas are not registered yet; must **update on edit**.

### Run Mission Mode
- On entry: **snapshot** current plan; block direct edits to committed topology unless explicitly out-of-scope (then document).
- Timeline controls + **named time-jump placeholders** (initial set — reconcile with `STATE_DECISION_GRAPH.md` if renamed):
  - `Launch`
  - `Route Start`
  - `Terrain Warning`
  - `Target Identification`
  - `PPS Cue`
  - `Route Branch Preview`
  - `RTB`
- Logs should support roundtable audit: at minimum structured hooks for cue event, preview, operator choice, validation warning, state transition (full persistence strategy can stay minimal).

### Cross-mode alignment (iconography + graph)
- **Preview vs commit:** any branch/hold/RTB geometry shown before operator confirmation should carry **`preview: true`** (or equivalent) for styling (**R7**) — **`0005`** implements cue-driven previews; this goal establishes the **mode + flag** contract.
- **Maneuvers 1–3** read as planned/rehearsed, not live stick control (iconography §5).
- On **Plan load / Plan edit**, prefer language from **STATE_DECISION_GRAPH.md**: **recompile** outline, decision tree, timeline where applicable.

## Verification
Run:
- `git diff --check`
- `npm run typecheck`
- `npm run build`

Expected:
- Mode switch works; Run Mission creates a snapshot and locks editing; returning to Plan restores editing.
- Timeline shell renders named demo beats (or updated names if graph supersedes).
- From **empty or new mission**, operator can add ordered steps and see outline + distances/warnings update (stubs OK).
- Documented or obvious **empty state** when no mission / no selection.

## Completion Instructions
- Commit with message: `Add plan and run mission modes`.
- Update this goal front matter with `status: "done"`, `completed_at`, and `commit_sha`.
- If blocked, set `status: "blocked"` and document exact blocker notes below.
- If timeline beat names change vs placeholders, update **`docs/STATE_DECISION_GRAPH.md`** or this goal in the same change so demo script and code stay aligned.

## Final Report Requirements
Return:
- changed files
- verification results
- screenshots or concise UI summary if available
- commit SHA
- blockers or follow-up questions

## Roundtable decisions (reference)

Plan/Run product decisions are **resolved** in **`docs/ROUNDTABLE_DEMO_REQUIREMENTS.md`** (*Decisions: Plan Mode, Run Mission Mode, And Product Shape*). Keep this goal aligned when that table changes.

## Blocker Notes
- None yet.
