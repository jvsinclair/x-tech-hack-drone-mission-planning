# Foundry-Hosted Planner Setup

## Purpose

This note captures the no-server Palantir path for the Sunol ISR mission planner. The local Vite app is the development and fallback harness; the preferred hackathon path is to host the same React app in Foundry and provide mission layers through a generated OSDK adapter.

## Current Implementation

- The app defaults to `auto` provider mode.
- When running in a Foundry-hosted context, the app first checks for `window.__FOUNDRY_MISSION_PROVIDER__`.
- If that adapter exists, it loads AOI-scoped objects from Foundry.
- If the adapter is absent, the app falls back to the static Goal 0001 bundle at `/resources/palantir_sunol_aoi_upload/`.
- If the static bundle is absent, the app keeps the Cesium map usable with built-in synthetic Sunol geometry.

## Minimum Foundry Object Concepts

- `Mission`
- `AreaOfInterest`
- `InfrastructureFeature`
- `RoadOrPath`
- `Building`
- `TerrainAttentionPoint`
- `NoGoZone`
- `UnitRoute`
- `DroneWaypoint`
- `RouteBranch`
- `CueZone`
- `CueEvent`
- `MissionStateTransition`

Goal 0002 only requires read access. Writeback, Actions, and state transitions are later-goal work.

## Adapter Contract

A Foundry-hosted build can register a generated OSDK-backed adapter before React mounts:

```ts
window.__FOUNDRY_MISSION_PROVIDER__ = {
  async loadMissionData() {
    return {
      provider: "foundry",
      status: "ready",
      missionName: "Sunol Ridge Training Area",
      loadedAt: new Date().toISOString(),
      notices: [],
      layers: []
    };
  }
};
```

The returned `layers` array must match the `MissionLayer` shape in `src/data/missionTypes.ts`. Keep geometry as WGS84 GeoJSON.

## Developer Console / OSDK Notes

- Do not commit Palantir workspace URLs, application RIDs, client secrets, user tokens, or generated credentials.
- Use Foundry auth and user permissions; do not hide secrets in frontend code.
- Generate the OSDK package from the hackathon Foundry Developer Console once object types exist.
- Map Foundry object types into the existing `MissionLayer` grouping instead of changing the map UI.
- Preserve the safety scope: ISR/recon planning only; no strike, engage, kinetic, target-selection, real drone control, MAVLINK/GCS, or hardware-control workflows.

## Local Fallback

Run locally:

```bash
npm install
npm run dev
```

The Vite dev server exposes `/resources/*` from the repo root when Goal 0001 artifacts are present. Production builds copy `resources/` into `dist/resources/` when available.
