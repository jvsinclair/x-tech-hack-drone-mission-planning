# Handoff: 2026-05-03 WSL Reboot / Goal Queue

## Summary
This handoff captures the safe stop point before rebooting out of the current WSL-based Codex Desktop session. The main repo is on `main`, synced and pushed to `origin/main` through commit `6a395c6`.

Goal 4 is complete and recorded. I did not start Goal 5 after the reboot request. The Vite dev server was stopped with Ctrl-C.

## Current State
- `validated`: `main` matches `origin/main` at `6a395c6 Record Goal 4 completion metadata`.
- `validated`: Goal 4 MGRS/LatLon coordinate display is implemented and marked `done`.
- `validated`: Goal 4 implementation commits are `7b70217 Add MGRS package dependency`, `0504470 Start MGRS coordinate display`, and `6a395c6 Record Goal 4 completion metadata`.
- `validated`: 3D map mode now switches to satellite imagery (`3D Sat`) while Topo mode remains OpenTopoMap.
- `provisional`: Goal 7 is currently `in_progress`; do not overwrite its metadata unless taking ownership intentionally.
- `todo`: First unstarted goal in queue order is Goal 5, `docs/goals/0005-pps-cue-zones-and-route-preview.md`.

## Important Artifacts
- `docs/goals/0004-mgrs-latlon-coordinate-display.md`: marked `done` with completion commit `0504470427e867074786639d116c12099c352484`.
- `src/data/coordinateFormat.ts`: MGRS/LatLon conversion and formatting helpers.
- `src/data/coordinateFormat.test.ts`: conversion, round-trip, invalid-input, and elevation formatting tests.
- `src/components/StatusBar.tsx`: cursor Lat/Lon and MGRS readout.
- `src/components/SelectedObjectPanel.tsx`: selected object Lat/Lon, MGRS, and elevation readout when available.
- `src/components/CesiumMissionMap.tsx`: cursor coordinate callback, representative selected-entity coordinate extraction, Topo/3D satellite switching.
- `package.json` / `package-lock.json`: include `mgrs` and `milsymbol`; `npm run generate:icons` works after the merge fix.

## Verification Run
- `git diff --check`: passed.
- `npm run test`: passed, 7 files / 21 tests.
- `npm run typecheck`: passed.
- `npm run build`: passed; Vite still warns that the Cesium bundle chunk is large.
- `npm run generate:icons`: passed after fixing the merged SIDC generator to use installed `milsymbol`.
- Manual smoke: headless Chrome screenshot confirmed 3D mode shows satellite imagery with `Satellite + terrain`.

## Queue Snapshot
- `0001`: done.
- `0002`: done.
- `0003`: done.
- `0004`: done.
- `0005`: todo.
- `0006`: todo.
- `0007`: in_progress.
- `0008`: todo.

## Open Questions
- Confirm whether the next CLI worker should take Goal 5 immediately, or wait if another agent is actively working Goal 7.
- Decide whether `.obsidian/` and `Resume.md` should remain local-only; they are currently untracked and intentionally untouched.

## Next Steps
1. After reboot, run `git status --short --branch` and confirm only expected local files are present.
2. Pull latest before work: `git pull --ff-only`.
3. If continuing the queue, start Goal 5 and update its front matter to `in_progress`.
4. Run `npm install` if dependencies are missing in the non-WSL environment.
5. Run `npm run test`, `npm run typecheck`, and `npm run build` after any app changes.

## Maintenance Notes
- Do not commit `.env`; the Cesium token is local-only.
- Do not touch `.obsidian/` or `Resume.md` unless the user explicitly asks.
- Preserve safety scope: ISR/recon planning only; no real drone control, MAVLINK/GCS export, strike, engage, kinetic action, target selection, or weapon release workflows.
