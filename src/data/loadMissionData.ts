/*
Module Context
Purpose:
- Choose the active mission data provider for the planner.
Why This Exists:
- Goal 0002 needs Foundry-hosted as the preferred path while preserving a static local fallback.
Primary Inputs/Outputs:
- Inputs: Preferred provider mode, optional Foundry adapter, optional static bundle.
- Outputs: MissionData for the planner shell.
Research / Source Links:
- docs/FOUNDRY_HOSTED_APP_SETUP.md
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
Validated:
- provisional: Provider fallback behavior is covered by tests.
Current Limits / TODO:
- Writeback/actions remain out of scope until later goals.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import { isLikelyFoundryHosted, loadFoundryMissionData } from "./foundryProvider";
import type { MissionData, MissionProviderId } from "./missionTypes";
import { loadStaticBundle, type StaticBundleProviderOptions } from "./staticBundleProvider";

export interface LoadMissionDataOptions extends StaticBundleProviderOptions {
  preferredProvider?: MissionProviderId;
}

export async function loadMissionData(options: LoadMissionDataOptions = {}): Promise<MissionData> {
  const preferredProvider = options.preferredProvider || providerFromEnvironment();

  if (preferredProvider === "foundry" || (preferredProvider === "auto" && isLikelyFoundryHosted())) {
    const foundryData = await loadFoundryMissionData();
    if (foundryData) return foundryData;
  }

  const staticData = await loadStaticBundle(options);
  if (preferredProvider === "foundry" && staticData.notices.length === 0) {
    return {
      ...staticData,
      notices: ["Foundry adapter unavailable. Loaded static scoped bundle instead."],
    };
  }
  if (preferredProvider === "foundry") {
    return {
      ...staticData,
      notices: ["Foundry adapter unavailable.", ...staticData.notices],
    };
  }
  return staticData;
}

function providerFromEnvironment(): MissionProviderId {
  const value = import.meta.env.VITE_MISSION_DATA_PROVIDER;
  if (value === "foundry" || value === "static") return value;
  return "auto";
}
