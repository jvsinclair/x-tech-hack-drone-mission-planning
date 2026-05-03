import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const emptyLayer = { type: "FeatureCollection" as const, features: [] };
  const localContext = {
    mission: {
      id: "mission-1",
      name: "Sunol Ridge Training Area",
      safetyScope: ["Synthetic ISR/recon route-planning demo only."],
      source: "local" as const,
      providerMessage: "Loaded local Sunol mission bundle.",
      bounds: { west: -121.9, south: 37.48, east: -121.74, north: 37.6 },
    },
    layers: {
      aoi: emptyLayer,
      unitRoute: emptyLayer,
      terrain: emptyLayer,
      noGo: emptyLayer,
      infrastructure: emptyLayer,
      roads: emptyLayer,
      buildings: emptyLayer,
      natural: emptyLayer,
    },
    sources: [],
    starterPackage: {
      name: "Sunol surveillance package",
      description: "Editable starter package.",
      waypoints: [],
    },
  };

  return {
    localContext,
    ensureMissionAndStarter: vi.fn(),
    getServerFoundryToken: vi.fn(),
    loadFoundryContext: vi.fn(),
    loadLocalBundle: vi.fn(),
  };
});

vi.mock("@/lib/palantir/client", () => ({
  getServerFoundryToken: mocks.getServerFoundryToken,
  loadFoundryContext: mocks.loadFoundryContext,
}));

vi.mock("@/lib/server/localBundle", () => ({
  loadLocalBundle: mocks.loadLocalBundle,
}));

vi.mock("@/lib/server/repository", () => ({
  ensureMissionAndStarter: mocks.ensureMissionAndStarter,
}));

import { GET } from "@/app/api/bootstrap/route";

describe("bootstrap route", () => {
  beforeEach(() => {
    mocks.getServerFoundryToken.mockReturnValue(null);
    mocks.loadFoundryContext.mockReset();
    mocks.loadLocalBundle.mockReturnValue(mocks.localContext);
    mocks.ensureMissionAndStarter.mockImplementation(async (context) => ({
      mission: context.mission,
      layers: context.layers,
      sources: context.sources,
      packages: [],
    }));
  });

  it("falls back to the local mission bundle when Palantir is selected without a token", async () => {
    const response = await GET(new NextRequest("http://localhost/api/bootstrap?source=palantir"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.mission.providerMessage).toBe("Palantir token was not configured; loaded local Sunol mission bundle.");
    expect(mocks.loadLocalBundle).toHaveBeenCalledTimes(1);
    expect(mocks.loadFoundryContext).not.toHaveBeenCalled();
    expect(mocks.ensureMissionAndStarter).toHaveBeenCalledWith(
      expect.objectContaining({
        mission: expect.objectContaining({
          providerMessage: "Palantir token was not configured; loaded local Sunol mission bundle.",
        }),
      }),
    );
  });
});
