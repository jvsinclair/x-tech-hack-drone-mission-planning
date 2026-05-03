# Covered Module Registry

This registry lists source modules that carry the structured context header required by `docs/MODULE_CONTEXT_HEADER_RULE.md`.

| Module path | Subsystem | Reason | Latest reviewed | Validation |
| --- | --- | --- | --- | --- |
| `vite.config.ts` | build/runtime | Serves and packages optional Goal 0001 resources for the app. | 2026-05-03 | provisional |
| `src/main.tsx` | app entrypoint | Mounts the first runnable planner surface. | 2026-05-03 | provisional |
| `src/App.tsx` | planner shell | Composes map, provider choice, layers, selection, and status. | 2026-05-03 | provisional |
| `src/components/CesiumMissionMap.tsx` | geospatial UI | Renders WGS84 mission layers in Cesium. | 2026-05-03 | provisional |
| `src/components/MapSymbologyLegend.tsx` | geospatial UI | Displays the canonical ISR map symbology legend over the Cesium planner. | 2026-05-03 | provisional |
| `src/components/LayerPanel.tsx` | planner controls | Exposes required Goal 0002 layer toggles. | 2026-05-03 | provisional |
| `src/components/MissionModePanel.tsx` | planner controls | Displays Plan/Run mode state, timeline jumps, and run log shell. | 2026-05-03 | provisional |
| `src/components/ModeSwitch.tsx` | planner controls | Provides global Plan Mission / Run Mission switching. | 2026-05-03 | provisional |
| `src/components/SelectedObjectPanel.tsx` | planner inspection | Displays selected map object metadata. | 2026-05-03 | provisional |
| `src/components/SourcesPanel.tsx` | planner inspection | Displays mission safety scope and source manifest provenance. | 2026-05-03 | provisional |
| `src/components/StatusBar.tsx` | planner status | Shows data provider and fallback status. | 2026-05-03 | provisional |
| `src/data/missionTypes.ts` | data contract | Defines provider, layer, and GeoJSON-facing app types. | 2026-05-03 | provisional |
| `src/data/missionGeojson.ts` | data contract | Normalizes static and Foundry GeoJSON/provenance fields. | 2026-05-03 | provisional |
| `src/data/cuePreviewContext.ts` | mission rehearsal | Resolves cue-zone and route-preview details for the decision panel. | 2026-05-03 | provisional |
| `src/data/ppsCuePreview.ts` | mission rehearsal | Interprets simulated PPS cue observations into preview-only commands. | 2026-05-03 | provisional |
| `src/data/layerCatalog.ts` | data contract | Maps Goal 0001 artifacts into operator layer groups. | 2026-05-03 | provisional |
| `src/data/staticBundleProvider.ts` | data provider | Loads scoped static bundle artifacts without Palantir access. | 2026-05-03 | provisional |
| `src/data/foundryProvider.ts` | data provider | Provides the no-server Foundry OSDK adapter seam. | 2026-05-03 | provisional |
| `src/data/loadMissionData.ts` | data provider | Selects Foundry first when available, then static fallback. | 2026-05-03 | provisional |
| `src/data/missionRun.ts` | mission rehearsal | Models editable plan summaries, immutable run snapshots, timeline jumps, and run logs. | 2026-05-03 | provisional |
| `src/data/placeholderMission.ts` | data provider | Keeps the map usable before Goal 0001 artifacts exist. | 2026-05-03 | provisional |
| `src/symbology/isrMapSymbology.ts` | geospatial UI | Centralizes R1/R2/R4/R5/R7 colors, route styles, legend items, and waypoint behavior glyph vocabulary. | 2026-05-03 | provisional |
| `src/symbology/cesiumIsrSymbology.ts` | geospatial UI | Applies ISR symbology tokens to Cesium entities and derived route/scan/camera waypoint overlays. | 2026-05-03 | provisional |
