---
goal_id: "0007"
title: "SIDC 2525D Squad Land Units SVG Picker And Map Rendering"
status: "todo"
created_at: "2026-05-03T18:00:00Z"
started_at: null
completed_at: null
owner: "codex-cli"
commit_sha: null
---

# Goal

Add **MIL-STD-2525D**-based **unit symbology** for **squad-level, land-only** entities: persist **30-character SIDC**, render **SVG** on the map, support a **picker** (browse / search / preview / apply) in the spirit of [sidc.milsymb.net](https://sidc.milsymb.net/?#/2525). **Waypoints and routing are unchanged** — this goal is **units only** (including friendly drone / platform icons modeled as ground-unit-class symbols where appropriate).

## Read First

1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/ROUNDTABLE_DEMO_REQUIREMENTS.md`
4. `docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md` — align **layer z-order** with this goal (see below); do not replace waypoint semantics from `0006`.
5. `docs/goals/0002-local-vite-cesium-planner-scaffold.md`
6. `docs/goals/0006-isr-map-symbology-waypoint-glyphs-and-legend.md` — **waypoints stay**; integrate **depth ordering** so units and waypoints do not fight.

## Product Rules (Authoritative For This Goal)

| Topic | Decision |
| --- | --- |
| **Standard** | **MIL-STD-2525D**; persist and validate **30-character SIDC** (document schema version in code or config). |
| **Scope** | **Land domain**, **squad echelon only** — do **not** require company or higher unit symbols for MVP (picker may still show parent echelons if the library lists them; **verification** is squad-focused). |
| **Affiliation** | Support all four: **Friendly**, **Hostile**, **Neutral**, **Unknown**. Rendering must follow **2525D / APP-6 affiliation styling** (frame and fill per symbol set — affiliation is the primary **at-a-glance** cue; **unit subtype** such as motorized vs infantry uses **SIDC / inner icon**, not a separate “equipment” overlay layer). |
| **Battle dimension** | **Units** only — **no** separate equipment-category workflow for this goal (no dedicated equipment overlay feature). |
| **Subtype** | Operators must be able to distinguish **motorized vs infantry** (and similar squad-relevant **land unit** distinctions) via **symbol selection** / SIDC. |
| **Modifiers** | Enable **squad-level-relevant** modifiers (e.g. HQ, task force, feint/dummy, mobility where applicable) per **2525D** — ship what the chosen SVG renderer exposes; document any gaps in completion notes. |
| **Labels** | Each rendered unit shows a **text label** (call sign, unit id, or user string) **next to or on** the symbol per UI layout. |
| **Output** | **SVG only** for symbol graphics: generate **SVG markup** from SIDC (or library equivalent), then integrate with Cesium (e.g. billboard / image from SVG). **No Canvas-only** rendering path required for production. |
| **Offline** | **No runtime CDN** for symbol generation. **Bundle** the renderer and any font or data dependencies with the app. After first successful load, behavior should remain usable **offline** (static bundle + normal browser cache / PWA cache if the app already uses it). |
| **Entity cap** | **No hard limit** in this goal; revisit if performance requires throttling later. |
| **Z-order (lower number = drawn on top)** | **0** — units / drones (SIDC entities). **20** — waypoint routing / mission route graphics from planner symbology. **40** — mapping / terrain / basemap-related layers. Implement using Cesium `eyeOffset` / `disableDepthTestDistance` / explicit primitive ordering / scene layering **as appropriate** so this ordering is consistent; document the mechanism in a short code comment or dev note. |

## Scope

Do:

- **Data model:** Add or extend a **unit** (or “tactical unit overlay”) model with: position (WGS84), **SIDC string (2525D)**, optional **modifier fields** the renderer needs, and **label text**. Persist in whatever store the app uses for demo scenarios.
- **SVG pipeline:** Integrate a **maintained** npm library that outputs **SVG from SIDC** for 2525D (evaluate candidates; lock choice in repo with LICENSE check). Wrap in a small **`sidcSymbols` (or similar) module** that returns SVG string + recommended size.
- **Picker UI:** Modal or side panel: filter by **affiliation**, **land / squad-relevant** families, **search**, **live SVG preview**, **apply** to selected unit or “place new unit.” UX benchmark: comparable workflow to [sidc.milsymb.net](https://sidc.milsymb.net/?#/2525) — full catalog depth optional; **minimum** is a **curated squad-land subset** plus search if the full tree is too large for one sprint.
- **Map:** Render units at **z-index layer 0** (top); waypoints remain at **20**; ensure route and terrain remain readable per table above.
- **Legend:** Extend or add a **Legend** entry for **affiliation** (four types) and **example** squad land symbols if not already covered.

Do not:

- Attach SIDC to **waypoints** as the primary design (this goal is **units only**).
- Replace Goal **0005** / **0006** behavior; **compose** with them.
- Introduce live classification or operational C2 — **simulation / planning** context only.

## Implementation Requirements

- Store **SIDC version** metadata if multiple 2525 editions could be confused later (at minimum document “2525D” in types).
- **TypeScript:** strict typing for unit entity and SIDC fields.
- Document in **README** or **`docs/`** one paragraph: module path, SIDC version, and link to this goal file.

## Verification

Run:

- `git diff --check`
- `npm run typecheck`
- `npm run build`

Expected:

- Place **at least two** land squad units with **different** subtypes (e.g. infantry vs motorized) and **two different** affiliations; symbols render as **SVG** and **labels** show.
- All **four** affiliations can be assigned and render **distinctly** per 2525D rules.
- **Waypoints** still render when present; **units draw above** route/terrain per z-order rules.
- **Offline:** With network disabled after first load, placing or editing a unit still works (bundled assets only).

## Completion Instructions

- Commit with message: `feat: 2525D SIDC squad land units SVG picker and map rendering`.
- Update this goal front matter with `status: "done"`, `completed_at`, and `commit_sha`.
- If blocked, set `status: "blocked"` and document blocker notes below.

## Final Report Requirements

Return:

- changed files
- npm library chosen for SVG-from-SIDC
- screenshot or description of picker + map with multiple affiliations
- verification results
- commit SHA
- modifiers deferred or not supported by library

## Blocker Notes

- None yet.
