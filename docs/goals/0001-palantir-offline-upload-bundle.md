---
goal_id: "0001"
title: "Palantir Offline Upload Bundle"
status: "done"
created_at: "2026-05-03T00:18:56Z"
started_at: "2026-05-03T01:51:11Z"
completed_at: "2026-05-03T01:53:30Z"
owner: "codex-cli"
commit_sha: "cb9eb1792218227b42f607b4ba801070e2069d34"
---

# Goal
Create the offline Sunol / Pleasanton Ridge upload bundle that the team can manually upload into Palantir when the Palantir environment has no internet access.

## Read First
1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/ROUNDTABLE_DEMO_REQUIREMENTS.md`
4. `docs/research/problem_statement_3_resource_map.md`
5. `docs/research/moving_unit_drone_mission_planning.md`

## Scope
Do:
- Create `resources/palantir_sunol_aoi_upload/`.
- Create scripts needed to fetch, normalize, and validate the bundle.
- Generate uploadable GeoJSON/CSV/Markdown/JSON files for Palantir.
- Include clear source provenance and safety scope language.

Do not:
- Build the local app.
- Add Palantir credentials, API keys, or instance-specific URLs.
- Commit caches, temporary downloads, huge raw DEM files, or local machine paths.
- Invent real source data if an external source fails.

## Implementation Requirements
- Use AOI bbox:
  - west `-121.90`
  - south `37.48`
  - east `-121.74`
  - north `37.60`
  - synthetic name `Sunol Ridge Training Area`
- Generate this bundle shape:
  - `README.md`
  - `PALANTIR_UPLOAD_PROMPT.md`
  - `manifest.json`
  - `aoi/sunol_training_area_aoi.geojson`
  - `osm/osm_power_lines.geojson`
  - `osm/osm_power_towers_poles.geojson`
  - `osm/osm_roads_tracks_paths.geojson`
  - `osm/osm_buildings.geojson`
  - `osm/osm_natural_features.geojson`
  - `osm/osm_waterways_barriers.geojson`
  - `official_power/cec_transmission_lines.geojson`
  - `official_power/hifld_transmission_lines.geojson`
  - `terrain/elevation_samples_500m.csv`
  - `terrain/terrain_attention_points.geojson`
  - `mission_fixture/synthetic_unit_route.geojson`
  - `mission_fixture/synthetic_drone_waypoints.geojson`
  - `mission_fixture/synthetic_route_branches.geojson`
  - `mission_fixture/synthetic_cue_zones.geojson`
  - `mission_fixture/synthetic_no_go_zones.geojson`
- Use live source APIs where available:
  - OSM / Overpass for power, roads, buildings, natural features, waterways, and barriers.
  - California Energy Commission ArcGIS FeatureServer for transmission lines.
  - HIFLD ArcGIS FeatureServer for transmission lines.
  - USGS EPQS for reduced 500m elevation samples.
- Use WGS84 GeoJSON for geospatial files.
- Include source fields on features where practical: `source_name`, `source_url`, `retrieved_at`, `provisional`.
- Include a validation script that confirms GeoJSON parses, CSV files have headers, and bundle files listed in `manifest.json` exist.
- The Palantir prompt must instruct Palantir to create object/map layers for AOI, power infrastructure, roads, buildings, terrain features, attention points, no-go zones, unit route, drone waypoints, route branches, and cue zones.
- The Palantir prompt must explicitly exclude strike, engage, kinetic, target-selection, weapon-release, real drone control, MAVLINK/GCS, and hardware-control workflows.

## Verification
Run:
- `git diff --check`
- `node scripts/validate-palantir-bundle.mjs`
- `find resources/palantir_sunol_aoi_upload -type f | sort`

Expected:
- Validation script passes.
- All required bundle files exist.
- `manifest.json` includes counts and provenance for each generated layer.
- No secrets or local-only paths are present.

## Completion Instructions
- Commit with message: `Create Palantir Sunol upload bundle`.
- Update this goal front matter with `status: "done"`, `completed_at`, and `commit_sha`.
- If blocked by source outage or missing runtime support, set `status: "blocked"` and document exact blocker notes below.

## Final Report Requirements
Return:
- changed files
- object counts by generated layer
- verification results
- commit SHA
- blockers or follow-up questions

## Blocker Notes
- None yet.
