/*
Module Context
Purpose:
- Format map coordinates for the rebuild planner UI.
Why This Exists:
- Operators need compact Lat/Lon and MGRS readouts without coupling React components to formatting libraries.
Primary Inputs/Outputs:
- Inputs: WGS84 lon/lat coordinates.
- Outputs: Display strings.
Research / Source Links:
- docs/PALANTIR_REBUILD_MASTER_PRD.md
Validated:
- provisional: Used in selected waypoint and status displays.
Current Limits / TODO:
- MGRS library failures degrade to Lat/Lon only.
Agent Maintenance Rule:
- Keep coordinate order explicit as lon, lat.
*/

import { forward as mgrsForward } from "mgrs";

export function formatLatLon(lon: number, lat: number): string {
  return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
}

export function formatMgrs(lon: number, lat: number): string {
  try {
    return mgrsForward([lon, lat], 5);
  } catch {
    return "MGRS unavailable";
  }
}
