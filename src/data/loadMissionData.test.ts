import { afterEach, describe, expect, it, vi } from "vitest";
import { loadMissionData } from "./loadMissionData";
import { createPlaceholderMissionData } from "./placeholderMission";
import type { MissionData } from "./missionTypes";

describe("loadMissionData", () => {
  afterEach(() => {
    delete window.__FOUNDRY_MISSION_PROVIDER__;
    vi.restoreAllMocks();
  });

  it("uses an injected Foundry adapter when requested", async () => {
    window.__FOUNDRY_MISSION_PROVIDER__ = {
      loadMissionData: vi.fn(async (): Promise<MissionData> => {
        const data = createPlaceholderMissionData();
        return {
          ...data,
          provider: "foundry",
          status: "ready",
          notices: [],
        };
      }),
    };

    const data = await loadMissionData({ preferredProvider: "foundry" });

    expect(data.provider).toBe("foundry");
    expect(data.status).toBe("ready");
  });

  it("falls back to static/placeholder data when Foundry is unavailable", async () => {
    const fetcher = vi.fn(async () => new Response("not found", { status: 404 }));

    const data = await loadMissionData({ preferredProvider: "foundry", fetcher });

    expect(data.provider).toBe("placeholder");
    expect(data.notices[0]).toContain("Foundry adapter unavailable");
  });
});
