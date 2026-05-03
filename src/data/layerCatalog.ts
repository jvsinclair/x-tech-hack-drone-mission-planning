/*
Module Context
Purpose:
- Define the planner layer contract and initial visual styling.
Why This Exists:
- Goals 0002 and 0005 need stable toggles that match the Goal 0001 bundle, Foundry Functions data, and the map symbology doc.
Primary Inputs/Outputs:
- Inputs: Goal 0001 artifact layer ids and operator symbology requirements.
- Outputs: Ordered layer definitions consumed by loaders and UI controls.
Research / Source Links:
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Covered by layer catalog tests.
Current Limits / TODO:
- Detailed waypoint glyphs and full legend behavior are deferred to goal 0006; route previews use provisional R7 styling here.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import type { LayerDefinition, LayerId } from "./missionTypes";

export const layerCatalog: LayerDefinition[] = [
  {
    id: "aoi",
    label: "AOI",
    description: "Sunol Ridge Training Area boundary.",
    defaultEnabled: true,
    artifactLayerIds: ["sunol_training_area_aoi"],
    style: {
      stroke: "#f4d35e",
      fill: "#f4d35e",
      strokeWidth: 2,
      strokeAlpha: 0.85,
      fillAlpha: 0.08,
    },
  },
  {
    id: "power",
    label: "Power Infrastructure",
    description: "Power lines, towers, poles, and official transmission layers.",
    defaultEnabled: true,
    artifactLayerIds: ["osm_power_lines", "osm_power_towers_poles", "cec_transmission_lines", "hifld_transmission_lines"],
    style: {
      stroke: "#ff8f3d",
      pointColor: "#ffc15e",
      strokeWidth: 2,
      strokeAlpha: 0.78,
    },
  },
  {
    id: "roads",
    label: "Roads / Tracks / Paths",
    description: "Movement and route context from roads, tracks, and paths.",
    defaultEnabled: true,
    artifactLayerIds: ["osm_roads_tracks_paths"],
    style: {
      stroke: "#d0d7d9",
      strokeWidth: 1,
      strokeAlpha: 0.54,
    },
  },
  {
    id: "buildings",
    label: "Buildings",
    description: "Building footprints for context and route review.",
    defaultEnabled: false,
    artifactLayerIds: ["osm_buildings"],
    style: {
      stroke: "#d9c7a3",
      fill: "#d9c7a3",
      strokeWidth: 1,
      strokeAlpha: 0.72,
      fillAlpha: 0.2,
    },
  },
  {
    id: "terrain",
    label: "Terrain Attention",
    description: "High-ground, obstacle, and coverage review points.",
    defaultEnabled: true,
    artifactLayerIds: ["terrain_attention_points"],
    style: {
      stroke: "#6de0d2",
      pointColor: "#6de0d2",
      strokeWidth: 2,
      strokeAlpha: 0.9,
    },
  },
  {
    id: "unitRoute",
    label: "Unit Route",
    description: "Synthetic friendly unit movement route.",
    defaultEnabled: true,
    artifactLayerIds: ["synthetic_unit_route"],
    style: {
      stroke: "#8ec07c",
      strokeWidth: 4,
      strokeAlpha: 0.84,
    },
  },
  {
    id: "droneBranches",
    label: "Drone Branches",
    description: "Route A, Route B, and RTB preview branches.",
    defaultEnabled: true,
    artifactLayerIds: ["synthetic_drone_waypoints", "synthetic_route_branches"],
    style: {
      stroke: "#ffd166",
      pointColor: "#ffd166",
      strokeWidth: 3,
      strokeAlpha: 0.66,
      dashed: true,
    },
  },
  {
    id: "cueZones",
    label: "Cue Zones",
    description: "Synthetic PPS cue preview zones.",
    defaultEnabled: true,
    artifactLayerIds: ["synthetic_cue_zones"],
    style: {
      stroke: "#ffd166",
      fill: "#ffd166",
      strokeWidth: 2,
      strokeAlpha: 0.86,
      fillAlpha: 0.16,
      dashed: true,
    },
  },
  {
    id: "noGoZones",
    label: "No-Go / Review",
    description: "Synthetic no-go and review zones.",
    defaultEnabled: true,
    artifactLayerIds: ["synthetic_no_go_zones"],
    style: {
      stroke: "#ff5c5c",
      fill: "#ff5c5c",
      strokeWidth: 2,
      strokeAlpha: 0.86,
      fillAlpha: 0.16,
    },
  },
];

export const defaultEnabledLayerIds = new Set<LayerId>(
  layerCatalog.filter((layer) => layer.defaultEnabled).map((layer) => layer.id),
);

export function getLayerDefinition(layerId: LayerId): LayerDefinition {
  const layer = layerCatalog.find((candidate) => candidate.id === layerId);
  if (!layer) throw new Error(`Unknown layer id: ${layerId}`);
  return layer;
}
