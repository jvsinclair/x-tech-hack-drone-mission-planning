/*
Module Context
Purpose:
- Convert and format WGS84 Lat/Lon and MGRS coordinates for planner readouts.
Why This Exists:
- Goal 0004 requires military grid display while keeping GeoJSON storage in WGS84.
Primary Inputs/Outputs:
- Inputs: WGS84 latitude/longitude, MGRS strings, optional elevation values.
- Outputs: formatted Lat/Lon strings, formatted MGRS strings, and conversion results.
Research / Source Links:
- docs/goals/0004-mgrs-latlon-coordinate-display.md
- docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md
Validated:
- provisional: Conversion and formatting helpers are covered by unit tests.
Current Limits / TODO:
- Elevation is displayed only when a caller provides it; terrain sampling lands in the terrain-altitude goal.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import * as mgrs from "mgrs";

export interface Wgs84DisplayCoordinate {
  lat: number;
  lon: number;
  elevationMeters?: number;
}

export function latLonToMgrs(coordinate: Wgs84DisplayCoordinate, accuracy = 5): string {
  assertValidLatLon(coordinate);
  return mgrs.forward([coordinate.lon, coordinate.lat], accuracy);
}

export function mgrsToLatLon(mgrsValue: string): Wgs84DisplayCoordinate {
  const [lon, lat] = mgrs.toPoint(mgrsValue.trim());
  return { lat, lon };
}

export function formatLatLon(coordinate: Wgs84DisplayCoordinate, precision = 6): string {
  assertValidLatLon(coordinate);
  return `${coordinate.lat.toFixed(precision)}, ${coordinate.lon.toFixed(precision)}`;
}

export function formatMgrs(mgrsValue: string): string {
  const compact = mgrsValue.replace(/\s+/g, "").toUpperCase();
  const match = compact.match(/^(\d{1,2}[C-HJ-NP-X])([A-HJ-NP-Z]{2})(\d*)$/);
  if (!match) return compact;

  const [, gridZone, square, numeric] = match;
  if (!numeric) return `${gridZone} ${square}`;
  const splitAt = Math.floor(numeric.length / 2);
  return `${gridZone} ${square} ${numeric.slice(0, splitAt)} ${numeric.slice(splitAt)}`.trim();
}

export function formatCoordinatePair(coordinate: Wgs84DisplayCoordinate): { latLon: string; mgrs: string; elevation?: string } {
  return {
    latLon: formatLatLon(coordinate),
    mgrs: formatMgrs(latLonToMgrs(coordinate)),
    elevation: formatElevation(coordinate.elevationMeters),
  };
}

export function formatElevation(elevationMeters: number | undefined): string | undefined {
  if (elevationMeters === undefined || !Number.isFinite(elevationMeters)) return undefined;
  return `${Math.round(elevationMeters)} m`;
}

export function isValidLatLon(value: unknown): value is Wgs84DisplayCoordinate {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Wgs84DisplayCoordinate>;
  return isLatitude(candidate.lat) && isLongitude(candidate.lon);
}

function assertValidLatLon(coordinate: Wgs84DisplayCoordinate) {
  if (!isValidLatLon(coordinate)) {
    throw new Error("Expected valid WGS84 coordinate with latitude -90..90 and longitude -180..180.");
  }
}

function isLatitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isLongitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}
