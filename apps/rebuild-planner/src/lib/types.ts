/*
Module Context
Purpose:
- Define the local rebuild planner contracts shared by Next route handlers, simulation logic, and React components.
Why This Exists:
- The rebuild isolates authored launch-package state from the older Vite app while preserving Palantir/local mission context.
Primary Inputs/Outputs:
- Inputs: Foundry Functions responses, local Sunol bundle GeoJSON, operator-authored waypoints/zones.
- Outputs: Typed planner payloads, package state, and simulation records.
Research / Source Links:
- docs/PALANTIR_REBUILD_MASTER_PRD.md
- docs/PROJECT_CONTEXT.md
Validated:
- provisional: Covered by unit and component tests in apps/rebuild-planner/tests.
Current Limits / TODO:
- Decision target zones are circles first; polygon authoring is deferred.
Agent Maintenance Rule:
- Keep these contracts aligned with API route responses and Prisma schema changes.
*/

export type GeoJsonGeometry = {
  type: string;
  coordinates: unknown;
};

export type GeoJsonFeature = {
  type: "Feature";
  geometry: GeoJsonGeometry | null;
  properties?: Record<string, unknown>;
};

export type GeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
};

export type MissionLayerId =
  | "aoi"
  | "unitRoute"
  | "terrain"
  | "noGo"
  | "infrastructure"
  | "roads"
  | "buildings"
  | "natural";

export type MissionLayers = Record<MissionLayerId, GeoJsonFeatureCollection>;

export type MissionSource = {
  layerId: string;
  sourceName: string;
  sourceUrl: string;
  retrievedAt: string;
  status: string;
  count: number;
};

export type MissionSummary = {
  id: string;
  name: string;
  safetyScope: string[];
  source: "palantir" | "local";
  providerMessage: string;
  bounds: {
    west: number;
    south: number;
    east: number;
    north: number;
  };
};

export type WaypointBehavior =
  | "launch"
  | "transit"
  | "scout"
  | "scan_area"
  | "observe"
  | "hold_loiter"
  | "decision"
  | "land"
  | "abort";

export type BranchType = "primary" | "alternate" | "hold" | "land";

export type WaypointRecord = {
  id: string;
  packageId: string;
  sequence: number;
  behavior: WaypointBehavior;
  name: string;
  objective: string;
  lon: number;
  lat: number;
  altitudeM: number | null;
  dwellSeconds: number | null;
};

export type DecisionPointRecord = {
  id: string;
  packageId: string;
  waypointId: string | null;
  name: string;
  targetZones: DecisionTargetZoneRecord[];
};

export type DecisionTargetZoneRecord = {
  id: string;
  decisionPointId: string;
  name: string;
  centerLon: number;
  centerLat: number;
  radiusM: number;
  allowedPps: number[];
};

export type BranchWaypointRecord = {
  id: string;
  packageId: string;
  decisionPointId: string;
  decisionTargetZoneId: string;
  branchType: BranchType;
  branchSequence: number;
  behavior: WaypointBehavior;
  name: string;
  objective: string;
  lon: number;
  lat: number;
  altitudeM: number | null;
  dwellSeconds: number | null;
};

export type RouteBranchRecord = {
  id: string;
  packageId: string;
  decisionPointId: string | null;
  type: BranchType;
  name: string;
  geometry: GeoJsonGeometry | null;
};

export type LaunchPackageRecord = {
  id: string;
  missionId: string;
  name: string;
  description: string;
  status: string;
  waypoints: WaypointRecord[];
  decisionPoints: DecisionPointRecord[];
  branchWaypoints: BranchWaypointRecord[];
  routeBranches: RouteBranchRecord[];
  warnings: ValidationWarningRecord[];
};

export type ValidationWarningRecord = {
  id: string;
  packageId: string;
  code: string;
  severity: "info" | "warning" | "blocker";
  message: string;
};

export type AuditLogRecord = {
  id: string;
  packageId: string;
  simulationId: string | null;
  kind: string;
  message: string;
  details: Record<string, unknown>;
  createdAt: string;
};

export type SimulationRecord = {
  id: string;
  packageId: string;
  status: "paused" | "playing" | "complete";
  clockSeconds: number;
  currentWaypointSeq: number;
  activeDecisionPointId: string | null;
  selectedTargetZoneId: string | null;
  activeBranchType: string | null;
  auditLog: AuditLogRecord[];
};

export type BootstrapPayload = {
  mission: MissionSummary;
  layers: MissionLayers;
  sources: MissionSource[];
  packages: LaunchPackageRecord[];
};

export type StarterWaypoint = Pick<WaypointRecord, "sequence" | "behavior" | "name" | "objective" | "lon" | "lat" | "altitudeM" | "dwellSeconds">;

export type StarterPackageSeed = {
  name: string;
  description: string;
  waypoints: StarterWaypoint[];
  decisionZone?: {
    decisionWaypointSequence: number;
    centerLon: number;
    centerLat: number;
    radiusM: number;
  };
};
