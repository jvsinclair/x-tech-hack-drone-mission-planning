/*
Module Context
Purpose:
- Centralize the Sunol AOI launch point and camera framing constants.
Why This Exists:
- The planner needs a stable 20 km x 20 km overhead planning view and a focused 3D terrain view for the same AOI.
Primary Inputs/Outputs:
- Inputs: Sunol launch point and AOI center constants.
- Outputs: WGS84 rectangle bounds, approximate AOI dimensions, and terrain availability status.
Research / Source Links:
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Pure AOI framing helpers are covered by unit tests.
Current Limits / TODO:
- The AOI is a demo training area frame, not an operational survey boundary.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

export interface Wgs84Coordinate {
  lat: number;
  lon: number;
}

export interface Wgs84RectangleDegrees {
  west: number;
  south: number;
  east: number;
  north: number;
}

export type MapViewMode = "topo" | "terrain3d";
export type TerrainSourceStatus = "cesium_world_terrain" | "ellipsoid_fallback";

export const SUNOL_LAUNCH_POINT: Wgs84Coordinate = {
  lat: 37.504646,
  lon: -121.832739,
};

export const SUNOL_AOI_CENTER: Wgs84Coordinate = {
  lat: 37.54,
  lon: -121.82,
};

export const SUNOL_AOI_SIDE_KM = 20;

export const SUNOL_AOI_RECTANGLE_DEGREES = squareAoiRectangle(SUNOL_AOI_CENTER, SUNOL_AOI_SIDE_KM);

export function squareAoiRectangle(center: Wgs84Coordinate, sideKm: number): Wgs84RectangleDegrees {
  const halfSideKm = sideKm / 2;
  const halfLatDegrees = halfSideKm / 110.574;
  const halfLonDegrees = halfSideKm / kmPerLongitudeDegree(center.lat);

  return {
    west: roundDegrees(center.lon - halfLonDegrees),
    south: roundDegrees(center.lat - halfLatDegrees),
    east: roundDegrees(center.lon + halfLonDegrees),
    north: roundDegrees(center.lat + halfLatDegrees),
  };
}

export function approximateRectangleSizeKm(rectangle: Wgs84RectangleDegrees): { widthKm: number; heightKm: number } {
  const centerLat = (rectangle.north + rectangle.south) / 2;
  return {
    widthKm: (rectangle.east - rectangle.west) * kmPerLongitudeDegree(centerLat),
    heightKm: (rectangle.north - rectangle.south) * 110.574,
  };
}

export function terrainSourceStatus(token: string | undefined): TerrainSourceStatus {
  return token?.trim() ? "cesium_world_terrain" : "ellipsoid_fallback";
}

function kmPerLongitudeDegree(latitude: number): number {
  return 111.32 * Math.cos((latitude * Math.PI) / 180);
}

function roundDegrees(value: number): number {
  return Number(value.toFixed(6));
}
