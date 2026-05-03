# Foundry-Hosted Planner Setup

## Purpose

This note captures the no-server Palantir path for the Sunol ISR mission planner. The local Vite app is the development and fallback harness; the current hackathon backend exposes read-only Foundry Functions REST calls and can later be replaced or supplemented by a generated OSDK adapter.

## Current Implementation

- The app defaults to `auto` provider mode.
- When running in a Foundry-hosted context, the app first checks for `window.__FOUNDRY_MISSION_PROVIDER__`.
- If that adapter exists, it loads AOI-scoped objects from the generated OSDK adapter.
- If no adapter exists but a bearer token is supplied at runtime, the app calls published Foundry Functions REST endpoints directly.
- If Foundry is unavailable, the app falls back to the static Goal 0001 bundle at `/resources/palantir_sunol_aoi_upload/`.
- If the static bundle is absent, the app keeps the Cesium map usable with built-in synthetic Sunol geometry.

## Live Functions REST Backend

- Foundry hostname: `nshackathon.palantirfoundry.com`
- Ontology RID: `ri.ontology.main.ontology.41fccd0c-2180-4c1d-841d-8a488d1abb46`
- Base URL shape:

```text
https://nshackathon.palantirfoundry.com/api/v2/ontologies/ri.ontology.main.ontology.41fccd0c-2180-4c1d-841d-8a488d1abb46/queries/{functionApiName}/execute
```

Published read functions currently wired by `src/data/foundryProvider.ts`:

- `getMissionBundle`
- `getAoi`
- `getInfrastructureContext`
- `getTerrainAttentionPoints`
- `getMissionRoute`
- `getRouteBranches`
- `getCueZones`
- `getNoGoZones`
- `getSourceManifest`

All functions take `{ "parameters": {} }` and return `{ "value": "<json-encoded-string>" }`; the app parses `value` before mapping it into `MissionData`.

The function set does not currently expose REST wrappers for `RoadOrPath`, `Building`, or `NaturalFeature` geometries. Those layers remain available through the static bundle fallback; direct Foundry object queries should wait for an OSDK package or explicit backend function additions.

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

The current app only requires read access. Writeback, Actions, and state transitions are later-goal work and must go through published functions; the v0.1 backend intentionally exposes no server-side mutation path.

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

## Local Bearer Token For REST Mode

Do not commit tokens or OAuth client secrets. For local testing, obtain a bearer token outside the app and supply it at runtime by one of:

```js
window.__FOUNDRY_BEARER_TOKEN__ = "paste-token-here"
localStorage.setItem("foundryBearerToken", "paste-token-here")
```

or in ignored local environment only:

```text
VITE_FOUNDRY_BEARER_TOKEN=paste-token-here
```

The frontend only sends `Authorization: Bearer <token>` to the Function execute endpoint. Confidential OAuth client credentials should stay outside browser code.

## Developer Console / OSDK Notes

- Do not commit client secrets, user tokens, generated credentials, or `.env.local`.
- The Team 3 Foundry hostname and ontology RID are committed because they are required non-secret API identifiers for the published Functions REST route.
- Use Foundry auth and user permissions; do not hide secrets in frontend code.
- Generate the OSDK package from the hackathon Foundry Developer Console if direct object queries or typed Actions become necessary.
- Map Foundry object types into the existing `MissionLayer` grouping instead of changing the map UI.
- Preserve the safety scope: ISR/recon planning only; no strike, engage, kinetic, target-selection, real drone control, MAVLINK/GCS, or hardware-control workflows.

## Local Fallback

Run locally:

```bash
npm install
npm run dev
```

The Vite dev server exposes `/resources/*` from the repo root when Goal 0001 artifacts are present. Production builds copy `resources/` into `dist/resources/` when available.
