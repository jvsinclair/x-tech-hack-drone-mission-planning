/*
Module Context
Purpose:
- Provide deterministic Sunol placeholder geometry when Goal 0001 data is absent.
Why This Exists:
- The planner must remain usable while Cloud or Palantir data preparation is still in progress.
Primary Inputs/Outputs:
- Inputs: Layer catalog definitions.
- Outputs: MissionData with WGS84 GeoJSON fixtures centered on Sunol / Pleasanton Ridge.
Research / Source Links:
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Used by loader tests and build verification.
Current Limits / TODO:
- Placeholder geometry is synthetic and intentionally minimal; Goal 0001 provides richer source-backed layers.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import { layerCatalog } from "./layerCatalog";
import type { GeoJsonFeature, GeoJsonFeatureCollection, LayerDefinition, MissionData, MissionLayer } from "./missionTypes";

const retrievedAt = "2026-05-03T00:00:00Z";

export function createPlaceholderMissionData(notice = "Bundle not generated yet. Showing built-in Sunol planning scaffold."): MissionData {
  return {
    provider: "placeholder",
    status: "missing",
    missionName: "Sunol Ridge Training Area",
    loadedAt: new Date().toISOString(),
    notices: [notice],
    layers: layerCatalog.map((definition) => placeholderLayer(definition)),
  };
}

function placeholderLayer(definition: LayerDefinition): MissionLayer {
  const geojson = placeholderGeojsonFor(definition.id);
  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    defaultEnabled: definition.defaultEnabled,
    style: definition.style,
    count: geojson.features.length,
    source: "Built-in synthetic placeholder",
    status: geojson.features.length > 0 ? "ready" : "missing",
    geojson,
  };
}

function placeholderGeojsonFor(layerId: LayerDefinition["id"]): GeoJsonFeatureCollection {
  switch (layerId) {
    case "aoi":
      return fc([
        polygon("sunol_training_area_aoi_placeholder", rectangle(-121.9, 37.48, -121.74, 37.6), {
          name: "Sunol Ridge Training Area",
          object_type: "area_of_interest",
        }),
      ]);
    case "unitRoute":
      return fc([
        line("synthetic_unit_route_placeholder", [
          [-121.887, 37.506],
          [-121.868, 37.518],
          [-121.849, 37.532],
          [-121.829, 37.546],
          [-121.806, 37.558],
        ], { name: "Synthetic unit route", object_type: "unit_route" }),
      ]);
    case "droneBranches":
      return fc([
        point("wp_launch", [-121.884, 37.508], { name: "Launch", sequence: 1, action: "launch" }),
        point("wp_decision_alpha", [-121.842, 37.538], { name: "Decision Alpha", sequence: 2, action: "decision" }),
        point("wp_scout_high_ground", [-121.819, 37.563], { name: "Scout High Ground", sequence: 3, action: "scout" }),
        line("route_a_close_overwatch", [
          [-121.842, 37.538],
          [-121.829, 37.546],
          [-121.81, 37.552],
        ], { branch_id: "route_a", name: "Route A close overwatch" }),
        line("route_b_scout_ahead", [
          [-121.842, 37.538],
          [-121.835, 37.552],
          [-121.819, 37.563],
          [-121.803, 37.558],
        ], { branch_id: "route_b", name: "Route B scout ahead" }),
      ]);
    case "cueZones":
      return fc([
        polygon("cue_zone_route_a", rectangle(-121.848, 37.534, -121.838, 37.543), {
          name: "Route A cue zone",
          cue_pps: 2,
        }),
        polygon("cue_zone_route_b", rectangle(-121.837, 37.544, -121.826, 37.556), {
          name: "Route B cue zone",
          cue_pps: 4,
        }),
      ]);
    case "noGoZones":
      return fc([
        polygon("synthetic_no_go_power_corridor", rectangle(-121.858, 37.548, -121.834, 37.557), {
          name: "Synthetic utility corridor review",
          no_go_type: "utility_corridor_buffer",
        }),
      ]);
    case "terrain":
      return fc([
        point("terrain_route_decision_review", [-121.842, 37.538], {
          name: "Decision review point",
          attention_type: "coverage_gap_review",
        }),
        point("terrain_high_ground_placeholder", [-121.819, 37.563], {
          name: "High-ground scout candidate",
          attention_type: "scout_high_ground",
        }),
      ]);
    default:
      return fc([]);
  }
}

function fc(features: GeoJsonFeature[]): GeoJsonFeatureCollection {
  return { type: "FeatureCollection", features: features.map(withProvenance) };
}

function withProvenance(feature: GeoJsonFeature): GeoJsonFeature {
  return {
    ...feature,
    properties: {
      ...(feature.properties || {}),
      source_name: "Built-in synthetic placeholder",
      source_url: "docs/goals/0002-local-vite-cesium-planner-scaffold.md",
      retrieved_at: retrievedAt,
      provisional: true,
    },
  };
}

function point(id: string, coordinates: [number, number], properties: Record<string, unknown>): GeoJsonFeature {
  return {
    type: "Feature",
    id,
    geometry: { type: "Point", coordinates },
    properties: { id, ...properties },
  };
}

function line(id: string, coordinates: [number, number][], properties: Record<string, unknown>): GeoJsonFeature {
  return {
    type: "Feature",
    id,
    geometry: { type: "LineString", coordinates },
    properties: { id, ...properties },
  };
}

function polygon(id: string, coordinates: [number, number][][], properties: Record<string, unknown>): GeoJsonFeature {
  return {
    type: "Feature",
    id,
    geometry: { type: "Polygon", coordinates },
    properties: { id, ...properties },
  };
}

function rectangle(west: number, south: number, east: number, north: number): [number, number][][] {
  return [[
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ]];
}
