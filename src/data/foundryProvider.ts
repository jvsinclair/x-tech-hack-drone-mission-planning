/*
Module Context
Purpose:
- Provide the adapter seam for Foundry-hosted OSDK mission data.
Why This Exists:
- The preferred no-server path is a Foundry-hosted app, but generated OSDK packages are instance-specific and must be injected after Developer Console setup.
Primary Inputs/Outputs:
- Inputs: Optional window.__FOUNDRY_MISSION_PROVIDER__ adapter registered by a Foundry-hosted build.
- Outputs: MissionData from Foundry or a typed unavailable result.
Research / Source Links:
- docs/FOUNDRY_HOSTED_APP_SETUP.md
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Unavailable behavior is exercised by provider tests.
Current Limits / TODO:
- No live OSDK calls are committed until object types, app RID, package name, and auth are configured in Foundry Developer Console.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import type { FoundryMissionProvider, MissionData } from "./missionTypes";

declare global {
  interface Window {
    __FOUNDRY_MISSION_PROVIDER__?: FoundryMissionProvider;
  }
}

export async function loadFoundryMissionData(): Promise<MissionData | null> {
  const adapter = globalThis.window?.__FOUNDRY_MISSION_PROVIDER__;
  if (!adapter) return null;
  return adapter.loadMissionData();
}

export function isLikelyFoundryHosted(hostname = globalThis.location?.hostname || ""): boolean {
  return hostname.includes("palantirfoundry.com") || hostname.includes("foundry");
}
