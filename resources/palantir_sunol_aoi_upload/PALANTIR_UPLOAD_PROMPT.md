# Palantir Upload Prompt

## Mission Context
We are Team 3 building a NatSec Hackathon prototype for Problem Statement 3: Mission Command and Control.

The prototype is a human-reviewed ISR/recon drone mission-planning workspace for a synthetic Sunol / Pleasanton Ridge scenario. The local app needs Palantir to act as the structured data and API layer for map context, mission fixtures, source provenance, and route/cue data.

We uploaded these files into this folder as flat/base filenames. Match each layer by filename only; do not require the original local subfolder paths.

## What We Uploaded
- `manifest.json`: bundle manifest with counts, source URLs, retrieval time, status, and source-health evidence.
- `sunol_training_area_aoi.geojson`: synthetic area of interest.
- `osm_power_lines.geojson`, `osm_power_towers_poles.geojson`: OSM power infrastructure context.
- `cec_transmission_lines.geojson`, `hifld_transmission_lines.geojson`: official/public transmission-line context.
- `osm_roads_tracks_paths.geojson`: roads, tracks, and paths.
- `osm_buildings.geojson`: building footprints.
- `osm_natural_features.geojson`: natural and vegetation features.
- `osm_vegetation_landcover.geojson`: vegetation and landcover polygons for Cesium/Palantir context.
- `osm_waterways_barriers.geojson`: waterways and barriers.
- `elevation_samples_500m.csv`: USGS EPQS elevation samples.
- `terrain_attention_points.geojson`: provisional terrain planning aids.
- `synthetic_unit_route.geojson`: friendly unit route fixture.
- `synthetic_drone_waypoints.geojson`: drone waypoint fixture.
- `synthetic_route_branches.geojson`: Route A, Route B, and RTB branch fixture.
- `synthetic_cue_zones.geojson`: PPS cue-zone fixture.
- `synthetic_no_go_zones.geojson`: synthetic no-go/review zones.

## Primary Ask
Create a Palantir-backed structured data layer that our local frontend can consume through an API, query, action, or function surface in our app.

Do not stop at storing files. Parse the uploaded files into usable structured datasets and Ontology objects, then expose a small application-facing contract that can return JSON/GeoJSON for the local app.

## Desired Ontology Or Dataset Model
Create object types or equivalent structured datasets for:
- `Mission`
- `AOI`
- `InfrastructureFeature`
- `RoadOrPath`
- `Building`
- `NaturalFeature`
- `TerrainAttentionPoint`
- `NoGoZone`
- `UnitRoute`
- `DroneWaypoint`
- `RouteBranch`
- `CueZone`
- `SourceManifest`

Preserve these fields wherever present:
- `id`
- `name`
- `geometry`
- `source_name`
- `source_url`
- `retrieved_at`
- `provisional`
- `layer_id`
- `evidence_refs`

Create useful links or relationships:
- `Mission` contains AOI, route, waypoints, route branches, cue zones, no-go zones, and terrain attention points.
- `RouteBranch` relates to the relevant cue zone through `command_preview` or cue PPS.
- `DroneWaypoint` relates to route branches and the unit route when spatially or semantically obvious.
- `NoGoZone`, infrastructure, terrain, roads, buildings, natural features, waterways, and barriers are map context for route review.
- `SourceManifest` records provenance for every generated layer.

## API Surface Needed By The Local App
Expose or define a Palantir-facing API/function/query contract with these capabilities. Return JSON or GeoJSON, use WGS84 coordinates, and include provenance fields.

- `getMissionBundle()`: returns bundle metadata, generated time, safety scope, layer counts, and source statuses from `manifest.json`.
- `getAoi()`: returns the AOI FeatureCollection.
- `getMapContextLayers()`: returns available context layer names and object/dataset references for roads, buildings, natural features, vegetation/landcover, waterways, barriers, and infrastructure.
- `getInfrastructureContext()`: returns OSM, CEC, and HIFLD power infrastructure features.
- `getTerrainAttentionPoints()`: returns terrain attention points with rationale, confidence, and recommended drone task.
- `getMissionRoute()`: returns the unit route and drone waypoints.
- `getRouteBranches()`: returns Route A, Route B, and RTB branches with `command_preview`.
- `getCueZones()`: returns PPS cue zones and their mapped command previews.
- `getNoGoZones()`: returns no-go/review zones.
- `getSourceManifest()`: returns the manifest provenance and source-health evidence.

For each API/function/query, provide:
- the exact Palantir object type, dataset, action, query, or function name to call
- request parameters, if any
- response shape
- one example call or usage note

## Map Setup
- Show AOI boundary first.
- Style power infrastructure and no-go zones as caution layers.
- Style roads/paths and buildings as neutral context layers.
- Style terrain attention points by `attention_type`.
- Style synthetic mission route, drone waypoints, and route branches as the primary demo overlays.
- Preserve `source_name`, `source_url`, `retrieved_at`, and `provisional` properties on imported objects.

## Workflow Language
Frame this as a human-reviewed ISR/recon planning workspace. Route branches and PPS cue zones are previews for preplanned options only.

Explicitly exclude and do not create any workflow for strike, engage, kinetic action, target selection, weapon release, real drone control, MAVLINK/GCS export, hardware control, or autonomous operational command. RTB, hold, route preview, observation, scan, scout, follow, and land/recover are allowed planning terms.
