# Palantir Upload Prompt

Use the files in this bundle to create an ISR/recon route-planning operational picture for the synthetic **Sunol Ridge Training Area**.

The files have been uploaded into this folder as flat/base filenames, so match each layer by filename only. Do not require the original local subfolder paths.

## Build These Object Or Map Layers
- AOI: `sunol_training_area_aoi.geojson`
- OSM power infrastructure: `osm_power_lines.geojson`, `osm_power_towers_poles.geojson`
- Official power infrastructure: `cec_transmission_lines.geojson`, `hifld_transmission_lines.geojson`
- Roads, tracks, and paths: `osm_roads_tracks_paths.geojson`
- Buildings: `osm_buildings.geojson`
- Natural features: `osm_natural_features.geojson`
- Waterways and barriers: `osm_waterways_barriers.geojson`
- Terrain samples and attention points: `elevation_samples_500m.csv`, `terrain_attention_points.geojson`
- Mission route: `synthetic_unit_route.geojson`
- Drone waypoint queue: `synthetic_drone_waypoints.geojson`
- Route branches: `synthetic_route_branches.geojson`
- Cue zones: `synthetic_cue_zones.geojson`
- No-go/review zones: `synthetic_no_go_zones.geojson`

## Desired Ontology Objects
- Mission
- AOI
- InfrastructureFeature
- RoadOrPath
- Building
- NaturalFeature
- TerrainAttentionPoint
- NoGoZone
- UnitRoute
- DroneWaypoint
- RouteBranch
- CueZone

## Map Setup
- Show AOI boundary first.
- Style power infrastructure and no-go zones as caution layers.
- Style roads/paths and buildings as neutral context layers.
- Style terrain attention points by `attention_type`.
- Style synthetic mission route, drone waypoints, and route branches as the primary demo overlays.
- Preserve `source_name`, `source_url`, `retrieved_at`, and `provisional` properties on imported objects.

## Workflow Language
Frame this as a human-reviewed ISR/recon planning workspace. Route branches and PPS cue zones are previews for preplanned options only.

Explicitly exclude and do not create any workflow for strike, engage, kinetic action, target selection, weapon release, real drone control, MAVLINK/GCS export, hardware control, or autonomous operational command. RTB, hold, route preview, observation, scan, scout, and land/recover are allowed planning terms.
