/*
Module Context
Purpose:
- Render planner data, map status, and cursor coordinates.
Why This Exists:
- The demo must make Foundry/static fallback state and military grid coordinates visible without blocking map use.
Primary Inputs/Outputs:
- Inputs: MissionData, load state, enabled layer count, mission mode, cursor coordinate, and load errors.
- Outputs: Compact status strip with Lat/Lon and MGRS cursor readouts.
Research / Source Links:
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/goals/0004-mgrs-latlon-coordinate-display.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Rendered through App shell tests.
Current Limits / TODO:
- Run-mode timeline and cue event logs land in later goals.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import { formatCoordinatePair, type Wgs84DisplayCoordinate } from "../data/coordinateFormat";
import type { MissionData } from "../data/missionTypes";
import type { PlannerMode } from "../data/missionRun";

interface StatusBarProps {
  cursorCoordinate: Wgs84DisplayCoordinate | null;
  enabledCount: number;
  isLoading: boolean;
  loadError: string | null;
  missionData: MissionData | null;
  mode: PlannerMode;
}

export function StatusBar({ cursorCoordinate, enabledCount, isLoading, loadError, missionData, mode }: StatusBarProps) {
  const notices = missionData?.notices || [];
  const cursor = cursorCoordinate ? formatCoordinatePair(cursorCoordinate) : null;
  return (
    <footer className="status-bar">
      <span>{isLoading ? "Loading" : missionData?.status || "idle"}</span>
      <span>Mode: {mode === "run" ? "Run Mission" : "Plan Mission"}</span>
      <span>Provider: {missionData?.provider || "pending"}</span>
      <span>Cursor: {cursor ? cursor.latLon : "off map"}</span>
      <span>MGRS: {cursor ? cursor.mgrs : "off map"}</span>
      <span>{enabledCount} layers enabled</span>
      {loadError ? <strong>{loadError}</strong> : null}
      {!loadError && notices.length > 0 ? <strong>{notices[0]}</strong> : null}
    </footer>
  );
}
