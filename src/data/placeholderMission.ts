/*
Module Context
Purpose:
- Provide deterministic Sunol placeholder geometry when Goal 0001 data is absent.
Why This Exists:
- The planner must remain usable while Cloud or Palantir data preparation is still in progress.
Primary Inputs/Outputs:
- Inputs: Layer catalog definitions.
- Outputs: MissionData with WGS84 GeoJSON fixtures, source entries, and safety scope centered on Sunol / Pleasanton Ridge.
Research / Source Links:
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/goals/0006-isr-map-symbology-waypoint-glyphs-and-legend.md
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
import { normalizeFeatureCollection } from "./missionGeojson";

const retrievedAt = "2026-05-03T00:00:00Z";

export function createPlaceholderMissionData(notice = "Bundle not generated yet. Showing built-in Sunol planning scaffold."): MissionData {
  return {
    provider: "placeholder",
    status: "missing",
    missionName: "Sunol Ridge Training Area",
    loadedAt: new Date().toISOString(),
    safetyScope: [
      "Synthetic ISR/recon route-planning demo only.",
      "No real drone control, MAVLINK/GCS, hardware-control, strike, engage, target-selection, or weapon-release workflows.",
      "Built-in placeholder layers are planning context only.",
    ],
    sources: [
      {
        layerId: "placeholder",
        sourceName: "Built-in synthetic placeholder",
        sourceUrl: "docs/goals/0002-local-vite-cesium-planner-scaffold.md",
        retrievedAt,
        status: "generated",
        provisional: true,
      },
    ],
    notices: [notice],
    layers: layerCatalog.map((definition) => placeholderLayer(definition)),
  };
}

function placeholderLayer(definition: LayerDefinition): MissionLayer {
  const geojson = normalizeFeatureCollection(placeholderGeojsonFor(definition.id));
  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    defaultEnabled: definition.defaultEnabled,
    style: definition.style,
    count: geojson.features.length,
    source: "Built-in synthetic placeholder",
    status: geojson.features.length > 0 ? "ready" : "missing",
    provisional: true,
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
          [-121.832739, 37.504646],
          [-121.868, 37.518],
          [-121.849, 37.532],
          [-121.829, 37.546],
          [-121.806, 37.558],
        ], { name: "Synthetic unit route", object_type: "unit_route" }),
      ]);
    case "droneBranches":
      return fc([
        point("wp_launch", [-121.832739, 37.504646], { name: "Launch", sequence: 1, action: "launch", behavior_type: "launch" }),
        point("wp_transit_overwatch", [-121.837, 37.522], { name: "Transit Overwatch", sequence: 2, action: "transit", behavior_type: "transit" }),
        point("wp_decision_alpha", [-121.842, 37.538], { name: "Decision Alpha", sequence: 3, action: "decision", behavior_type: "decision" }),
        point("wp_hold_loiter", [-121.829, 37.546], { name: "Hold / Loiter", sequence: 4, action: "hold", behavior_type: "hold_loiter" }),
        point("wp_scout_high_ground", [-121.819, 37.563], { name: "Scout High Ground", sequence: 5, action: "scout", behavior_type: "scout" }),
        point("wp_scan_saddle", [-121.81, 37.552], { name: "Scan Saddle", sequence: 6, action: "scan area", behavior_type: "scan_area" }),
        point("wp_rtb_commit", [-121.862, 37.523], { name: "RTB Gate", sequence: 7, action: "rtb", behavior_type: "rtb" }),
        point("wp_land_recover", [-121.884, 37.508], { name: "Land / Recover", sequence: 8, action: "land", behavior_type: "land" }),
        line("route_tread_launch_to_decision", [
          [-121.832739, 37.504646],
          [-121.837, 37.522],
          [-121.842, 37.538],
        ], { name: "Executed route to decision", route_status: "tread" }),
        line("route_untread_decision_to_scan", [
          [-121.842, 37.538],
          [-121.829, 37.546],
          [-121.819, 37.563],
          [-121.81, 37.552],
        ], { name: "Remaining route after decision", route_status: "untread" }),
        line("route_a_close_overwatch", [
          [-121.842, 37.538],
          [-121.829, 37.546],
          [-121.81, 37.552],
        ], { branch_id: "route_a", command_preview: "preview_route_a", name: "Route A close overwatch" }),
        line("route_b_scout_ahead", [
          [-121.842, 37.538],
          [-121.835, 37.552],
          [-121.819, 37.563],
          [-121.803, 37.558],
        ], { branch_id: "route_b", command_preview: "preview_route_b", name: "Route B scout ahead" }),
        line("rtb_recover_branch", [
          [-121.842, 37.538],
          [-121.862, 37.523],
          [-121.884, 37.508],
        ], { branch_id: "rtb", command_preview: "preview_return_to_base", name: "Return-to-base branch" }),
      ]);
    case "cueZones":
      return fc([
        polygon("cue_zone_route_a", rectangle(-121.848, 37.534, -121.838, 37.543), {
          name: "Route A cue zone",
          cue_pps: 2,
          command_preview: "preview_route_a",
        }),
        polygon("cue_zone_route_b", rectangle(-121.837, 37.544, -121.826, 37.556), {
          name: "Route B cue zone",
          cue_pps: 4,
          command_preview: "preview_route_b",
        }),
        polygon("cue_zone_rtb", rectangle(-121.871, 37.516, -121.858, 37.529), {
          name: "RTB cue zone",
          cue_pps: 8,
          command_preview: "preview_return_to_base",
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
