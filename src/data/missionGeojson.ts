/*
Module Context
Purpose:
- Normalize mission GeoJSON feature properties across static fixtures and Foundry Functions.
Why This Exists:
- Static artifacts use snake_case while Foundry Functions return camelCase; the UI needs one provider-agnostic contract for previews, provenance, labels, and coordinates.
Primary Inputs/Outputs:
- Inputs: WGS84 GeoJSON-like features and feature collections.
- Outputs: Normalized features plus representative WGS84 coordinates for panels and derived preview overlays.
Research / Source Links:
- docs/PROJECT_CONTEXT.md
- docs/goals/0005-pps-cue-zones-and-route-preview.md
- docs/FOUNDRY_HOSTED_APP_SETUP.md
Validated:
- provisional: Normalization is covered by focused unit tests.
Current Limits / TODO:
- Geometry helpers are lightweight display aids, not topology validators or certified geospatial analysis.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import type { GeoJsonFeature, GeoJsonFeatureCollection } from "./missionTypes";
import type { Wgs84DisplayCoordinate } from "./coordinateFormat";

type FeatureProperties = Record<string, unknown>;

export function normalizeFeatureCollection(collection: GeoJsonFeatureCollection): GeoJsonFeatureCollection {
  return {
    ...collection,
    features: (collection.features || []).map(normalizeFeature),
  };
}

export function normalizeFeature(feature: GeoJsonFeature): GeoJsonFeature {
  return {
    ...feature,
    properties: normalizeFeatureProperties(feature.properties || {}),
  };
}

export function normalizeFeatureProperties(properties: FeatureProperties): FeatureProperties {
  const next: FeatureProperties = { ...properties };

  copyAlias(next, "commandPreview", "command_preview");
  copyAlias(next, "sourceName", "source_name");
  copyAlias(next, "sourceUrl", "source_url");
  copyAlias(next, "retrievedAt", "retrieved_at");
  copyAlias(next, "layerId", "layer_id");
  copyAlias(next, "cueZoneId", "cue_zone_id");
  copyAlias(next, "routeBranchId", "route_branch_id");
  copyAlias(next, "unitRouteId", "unit_route_id");
  copyAlias(next, "branchLabel", "branch_label");
  copyAlias(next, "branchType", "branch_type");
  copyAlias(next, "waypointType", "waypoint_type");
  copyAlias(next, "attentionType", "attention_type");
  copyAlias(next, "recommendedDroneTask", "recommended_drone_task");
  copyAlias(next, "elevationM", "elevation_m");
  copyAlias(next, "ppsLabel", "pps_label");

  if (next.cuePps === undefined && next.cue_pps !== undefined) {
    next.cuePps = toNumber(next.cue_pps);
  }
  if (next.cue_pps === undefined && next.cuePps !== undefined) {
    next.cue_pps = next.cuePps;
  }
  if (next.ppsLabel === undefined && next.cuePps !== undefined) {
    next.ppsLabel = `${next.cuePps} PPS`;
  }

  const commandPreview = commandPreviewFromProperties(next);
  if (commandPreview && next.preview === undefined) {
    next.preview = true;
  }

  return next;
}

export function commandPreviewFromProperties(properties: FeatureProperties | undefined): string | undefined {
  const value = properties?.commandPreview ?? properties?.command_preview;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function cuePpsFromProperties(properties: FeatureProperties | undefined): number | undefined {
  const value = properties?.cuePps ?? properties?.cue_pps;
  return toNumber(value);
}

export function propertyString(properties: FeatureProperties | undefined, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = properties?.[key];
    if (typeof value === "string" && value.trim().length > 0) return value;
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

export function featureDisplayName(feature: GeoJsonFeature): string {
  return propertyString(feature.properties, "name", "label", "id") || String(feature.id || "Mission feature");
}

export function featureIsProvisional(feature: GeoJsonFeature): boolean {
  return feature.properties?.provisional === true || feature.properties?.provisional === "true";
}

export function featureCollectionHasProvisional(collection: GeoJsonFeatureCollection): boolean {
  return collection.features.some(featureIsProvisional);
}

export function sortedWaypointFeatures(features: GeoJsonFeature[]): GeoJsonFeature[] {
  return [...features].sort((a, b) => (sequenceOf(a) ?? Number.MAX_SAFE_INTEGER) - (sequenceOf(b) ?? Number.MAX_SAFE_INTEGER));
}

export function sequenceOf(feature: GeoJsonFeature): number | undefined {
  return toNumber(feature.properties?.sequence);
}

export function representativeFeatureCoordinate(feature: GeoJsonFeature): Wgs84DisplayCoordinate | undefined {
  const coordinates = flattenCoordinatePairs(feature.geometry?.coordinates);
  if (coordinates.length === 0) return undefined;

  const total = coordinates.reduce<{ lon: number; lat: number; elevationMeters: number; elevationCount: number }>(
    (sum, coordinate) => ({
      lon: sum.lon + coordinate.lon,
      lat: sum.lat + coordinate.lat,
      elevationMeters: sum.elevationMeters + (coordinate.elevationMeters ?? 0),
      elevationCount: sum.elevationCount + (coordinate.elevationMeters === undefined ? 0 : 1),
    }),
    { lon: 0, lat: 0, elevationMeters: 0, elevationCount: 0 },
  );

  return {
    lon: total.lon / coordinates.length,
    lat: total.lat / coordinates.length,
    elevationMeters: total.elevationCount === 0 ? undefined : total.elevationMeters / total.elevationCount,
  };
}

export function firstFeatureCoordinate(feature: GeoJsonFeature): Wgs84DisplayCoordinate | undefined {
  return flattenCoordinatePairs(feature.geometry?.coordinates)[0];
}

function copyAlias(properties: FeatureProperties, camelKey: string, snakeKey: string) {
  if (properties[camelKey] === undefined && properties[snakeKey] !== undefined) {
    properties[camelKey] = properties[snakeKey];
  }
  if (properties[snakeKey] === undefined && properties[camelKey] !== undefined) {
    properties[snakeKey] = properties[camelKey];
  }
}

function flattenCoordinatePairs(value: unknown): Wgs84DisplayCoordinate[] {
  if (!Array.isArray(value)) return [];
  if (typeof value[0] === "number" && typeof value[1] === "number") {
    const elevation = typeof value[2] === "number" ? value[2] : undefined;
    return [{ lon: value[0], lat: value[1], elevationMeters: elevation }];
  }
  return value.flatMap(flattenCoordinatePairs);
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}
