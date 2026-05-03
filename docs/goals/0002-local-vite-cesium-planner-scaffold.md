---
goal_id: "0002"
title: "Local Vite Cesium Planner Scaffold"
status: "todo"
created_at: "2026-05-03T00:18:56Z"
started_at: null
completed_at: null
owner: "codex-cli"
commit_sha: null
---

# Goal
Scaffold a fast local web app for the ISR drone mission planner using Vite, React, TypeScript, and CesiumJS.

## Read First
1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/ROUNDTABLE_DEMO_REQUIREMENTS.md`
4. `docs/goals/0001-palantir-offline-upload-bundle.md`

## Scope
Do:
- Create the frontend application scaffold.
- Render a Cesium map centered on the Sunol AOI.
- Load the local Palantir upload bundle outputs if present.
- Add a clean operator-style shell with map, layer panel, selected-object panel, and status bar.

Do not:
- Add backend services.
- Add live Palantir SDK integration.
- Add kinetic, strike, real-drone-control, or MAVLINK/GCS functionality.
- Use a heavy UI framework that slows down the laptop.

## Implementation Requirements
- Use:
  - Vite
  - React
  - TypeScript
  - CesiumJS
  - plain CSS or CSS modules
- Keep the app lightweight. Avoid Next.js, SSR, heavyweight component kits, and unnecessary backend services.
- Add npm scripts for at least:
  - `dev`
  - `build`
  - `preview`
  - `typecheck`
- The first screen should be the actual planner shell, not a marketing page.
- Center the map on Sunol / Pleasanton Ridge near `37.54, -121.82`.
- Add initial layer toggles for:
  - AOI
  - power infrastructure
  - roads/tracks/paths
  - buildings
  - terrain attention points
  - unit route
  - drone route branches
  - cue zones
  - no-go zones
- If generated bundle files are missing, show a non-blocking "bundle not generated yet" state and keep the map usable.
- Keep internal geometry as WGS84 GeoJSON.

## Verification
Run:
- `git diff --check`
- `npm install`
- `npm run typecheck`
- `npm run build`

Expected:
- Build completes.
- Typecheck passes.
- App can be run with `npm run dev`.
- Cesium map renders without requiring Palantir access.

## Completion Instructions
- Commit with message: `Scaffold Cesium mission planner`.
- Update this goal front matter with `status: "done"`, `completed_at`, and `commit_sha`.
- If blocked, set `status: "blocked"` and document exact blocker notes below.

## Final Report Requirements
Return:
- changed files
- verification results
- local dev URL
- commit SHA
- blockers or follow-up questions

## Blocker Notes
- None yet.
