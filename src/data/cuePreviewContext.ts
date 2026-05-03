/*
Module Context
Purpose:
- Resolve cue-preview panel details from mission layers.
Why This Exists:
- Goal 0005 needs the decision panel to show the cue zone, route preview, coordinate readout, and provenance without coupling React components to raw layer scans.
Primary Inputs/Outputs:
- Inputs: MissionData plus a PPS cue preview result.
- Outputs: Cue decision context with matched cue zone, route branch, and representative WGS84 coordinate.
Research / Source Links:
- docs/goals/0005-pps-cue-zones-and-route-preview.md
- docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md
- docs/research/pps_drone_command_mapping_plan.md
Validated:
- provisional: Helper behavior is covered by unit tests through the PPS preview UI.
Current Limits / TODO:
- Hold/loiter previews may not have a dedicated cue zone or branch until the backend adds one.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import type { Wgs84DisplayCoordinate } from "./coordinateFormat";
import {
  commandPreviewFromProperties,
  cuePpsFromProperties,
  featureDisplayName,
  representativeFeatureCoordinate,
} from "./missionGeojson";
import type { GeoJsonFeature, MissionData } from "./missionTypes";
import type { PpsCuePreviewResult } from "./ppsCuePreview";

export interface CueDecisionContext {
  cueZoneName?: string;
  routePreviewName?: string;
  ppsLabel?: string;
  coordinate?: Wgs84DisplayCoordinate;
}

export function buildCueDecisionContext(
  missionData: MissionData | null,
  preview: PpsCuePreviewResult | null,
): CueDecisionContext {
  if (!missionData || !preview?.matchedCommand) return {};

  const cueZone = findFeatureByCommand(missionData, "cueZones", preview.matchedCommand);
  const routePreview = findFeatureByCommand(missionData, "droneBranches", preview.matchedCommand);
  const cuePps = cuePpsFromProperties(cueZone?.properties);

  return {
    cueZoneName: cueZone ? featureDisplayName(cueZone) : undefined,
    routePreviewName: routePreview ? featureDisplayName(routePreview) : undefined,
    ppsLabel: cueZone?.properties?.ppsLabel ? String(cueZone.properties.ppsLabel) : cuePps ? `${cuePps} PPS` : undefined,
    coordinate: cueZone ? representativeFeatureCoordinate(cueZone) : undefined,
  };
}

function findFeatureByCommand(
  missionData: MissionData,
  layerId: "cueZones" | "droneBranches",
  commandPreview: string,
): GeoJsonFeature | undefined {
  return missionData.layers
    .find((layer) => layer.id === layerId)
    ?.geojson.features.find((feature) => commandPreviewFromProperties(feature.properties) === commandPreview);
}
