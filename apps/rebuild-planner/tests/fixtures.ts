import type { BootstrapPayload, LaunchPackageRecord, SimulationRecord } from "@/lib/types";

export const emptyLayer = { type: "FeatureCollection" as const, features: [] };
export const terrainLayer = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      geometry: { type: "Point", coordinates: [-121.884, 37.508] },
      properties: { elevationM: 60 },
    },
    {
      type: "Feature" as const,
      geometry: { type: "Point", coordinates: [-121.842, 37.538] },
      properties: { elevationM: 260 },
    },
  ],
};

export function packageFixture(overrides?: Partial<LaunchPackageRecord>): LaunchPackageRecord {
  return {
    id: "pkg-1",
    missionId: "mission-1",
    name: "Sunol surveillance package",
    description: "",
    status: "draft",
    waypoints: [
      { id: "wp-launch", packageId: "pkg-1", sequence: 1, behavior: "launch", name: "Launch", objective: "", lon: -121.884, lat: 37.508, altitudeM: 20, dwellSeconds: null },
      { id: "wp-decision", packageId: "pkg-1", sequence: 2, behavior: "decision", name: "Decision Alpha", objective: "", lon: -121.842, lat: 37.538, altitudeM: 20, dwellSeconds: null },
    ],
    decisionPoints: [
      {
        id: "decision-1",
        packageId: "pkg-1",
        waypointId: "wp-decision",
        name: "Decision Alpha",
        targetZones: [{ id: "zone-1", decisionPointId: "decision-1", name: "DTZ-1", centerLon: -121.842, centerLat: 37.538, radiusM: 250, allowedPps: [1, 2, 4, 8] }],
      },
    ],
    branchWaypoints: [],
    routeBranches: [],
    warnings: [],
    ...overrides,
  };
}

export function simulationFixture(packageId = "pkg-1", overrides?: Partial<SimulationRecord>): SimulationRecord {
  return {
    id: "sim-1",
    packageId,
    status: "paused",
    clockSeconds: 0,
    currentWaypointSeq: 1,
    activeDecisionPointId: null,
    selectedTargetZoneId: null,
    activeBranchType: null,
    auditLog: [],
    ...overrides,
  };
}

export function bootstrapFixture(currentPackage: LaunchPackageRecord): BootstrapPayload {
  return {
    mission: {
      id: "mission-1",
      name: "Sunol Ridge Training Area",
      safetyScope: ["Synthetic ISR/recon route-planning demo only."],
      source: "local",
      providerMessage: "Loaded local Sunol mission bundle.",
      bounds: { west: -121.9, south: 37.48, east: -121.74, north: 37.6 },
    },
    layers: { aoi: emptyLayer, unitRoute: emptyLayer, terrain: terrainLayer, noGo: emptyLayer, infrastructure: emptyLayer, roads: emptyLayer, buildings: emptyLayer, natural: emptyLayer },
    sources: [],
    packages: [currentPackage],
  };
}
