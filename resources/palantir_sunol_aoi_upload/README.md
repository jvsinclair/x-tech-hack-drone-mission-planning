# Sunol Ridge Training Area Palantir Offline Upload Bundle

This bundle packages public geospatial context and synthetic mission fixtures for a Palantir upload workflow.

## Safety Scope

- ISR/recon route-planning demo only.
- No strike, engage, kinetic, target-selection, weapon-release, real drone control, MAVLINK/GCS, or hardware-control workflows.
- All mission actors, route branches, cue zones, no-go zones, and mission events are synthetic.
- Public-source terrain and infrastructure layers are provisional planning context, not operational truth.

## AOI

- Name: Sunol Ridge Training Area
- West/South/East/North: -121.9, 37.48, -121.74, 37.6

## Upload Order

1. `aoi/sunol_training_area_aoi.geojson`
2. Official and OSM power layers.
3. Roads, buildings, natural features, vegetation/landcover, waterways, and barriers.
4. `terrain/elevation_samples_500m.csv` and `terrain/terrain_attention_points.geojson`.
5. Synthetic mission fixtures under `mission_fixture/`.
6. Use `PALANTIR_UPLOAD_PROMPT.md` as the instruction prompt for Palantir/AIP setup.

## Layer Counts

| Layer | Count | Status |
| --- | ---: | --- |
| sunol_training_area_aoi | 1 | generated |
| osm_power_lines | 38 | generated |
| osm_power_towers_poles | 268 | generated |
| osm_roads_tracks_paths | 727 | generated |
| osm_buildings | 312 | generated |
| osm_natural_features | 124 | generated |
| osm_vegetation_landcover | 61 | generated |
| osm_waterways_barriers | 485 | generated |
| cec_transmission_lines | 26 | generated |
| hifld_transmission_lines | 17 | generated |
| elevation_samples_500m | 783 | generated |
| synthetic_unit_route | 1 | generated |
| synthetic_drone_waypoints | 5 | generated |
| synthetic_route_branches | 3 | generated |
| synthetic_cue_zones | 3 | generated |
| synthetic_no_go_zones | 2 | generated |
| terrain_attention_points | 4 | generated |

## Provenance

See `manifest.json` for source URLs, retrieval time, counts, and provisional status per layer.
