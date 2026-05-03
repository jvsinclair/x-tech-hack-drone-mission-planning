/*
Module Context
Purpose:
- Render planner data and map status.
Why This Exists:
- The demo must make Foundry/static fallback state visible without blocking map use.
Primary Inputs/Outputs:
- Inputs: MissionData, load state, enabled layer count, load errors.
- Outputs: Compact status strip.
Research / Source Links:
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Rendered through App shell tests.
Current Limits / TODO:
- Run-mode timeline and cue event logs land in later goals.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import type { MissionData } from "../data/missionTypes";

interface StatusBarProps {
  enabledCount: number;
  isLoading: boolean;
  loadError: string | null;
  missionData: MissionData | null;
}

export function StatusBar({ enabledCount, isLoading, loadError, missionData }: StatusBarProps) {
  const notices = missionData?.notices || [];
  return (
    <footer className="status-bar">
      <span>{isLoading ? "Loading" : missionData?.status || "idle"}</span>
      <span>Provider: {missionData?.provider || "pending"}</span>
      <span>{enabledCount} layers enabled</span>
      {loadError ? <strong>{loadError}</strong> : null}
      {!loadError && notices.length > 0 ? <strong>{notices[0]}</strong> : null}
    </footer>
  );
}
