/*
Module Context
Purpose:
- Convert Prisma records into API-safe rebuild planner records.
Why This Exists:
- The client should not know Prisma field names for JSON-string storage details.
Primary Inputs/Outputs:
- Inputs: Prisma query results.
- Outputs: Launch package, simulation, and audit records.
Research / Source Links:
- docs/PALANTIR_REBUILD_MASTER_PRD.md
Validated:
- provisional: Used by every API route response.
Current Limits / TODO:
- JSON parse failures degrade to empty objects rather than failing route responses.
Agent Maintenance Rule:
- Keep in sync with prisma/schema.prisma.
*/

import type {
  AuditLogRecord,
  BranchType,
  BranchWaypointRecord,
  DecisionPointRecord,
  LaunchPackageRecord,
  RouteBranchRecord,
  SimulationRecord,
  ValidationWarningRecord,
  WaypointBehavior,
  WaypointRecord,
} from "@/lib/types";

type PackageLike = {
  id: string;
  missionId: string;
  name: string;
  description: string;
  status: string;
  waypoints?: WaypointLike[];
  decisionPoints?: DecisionPointLike[];
  branchWaypoints?: BranchWaypointLike[];
  routeBranches?: RouteBranchLike[];
  warnings?: WarningLike[];
};

type WaypointLike = {
  id: string;
  packageId: string;
  sequence: number;
  behavior: string;
  name: string;
  objective: string;
  lon: number;
  lat: number;
  altitudeM: number | null;
  dwellSeconds: number | null;
};

type BranchWaypointLike = {
  id: string;
  packageId: string;
  decisionPointId: string;
  decisionTargetZoneId: string;
  branchType: string;
  branchSequence: number;
  behavior: string;
  name: string;
  objective: string;
  lon: number;
  lat: number;
  altitudeM: number | null;
  dwellSeconds: number | null;
};

type DecisionPointLike = {
  id: string;
  packageId: string;
  waypointId: string | null;
  name: string;
  targetZones?: TargetZoneLike[];
};

type TargetZoneLike = {
  id: string;
  decisionPointId: string;
  name: string;
  centerLon: number;
  centerLat: number;
  radiusM: number;
  allowedPpsJson: string;
};

type RouteBranchLike = {
  id: string;
  packageId: string;
  decisionPointId: string | null;
  type: string;
  name: string;
  geometryJson: string;
};

type WarningLike = {
  id: string;
  packageId: string;
  code: string;
  severity: string;
  message: string;
};

type AuditLike = {
  id: string;
  packageId: string;
  simulationId: string | null;
  kind: string;
  message: string;
  detailsJson: string;
  createdAt: Date;
};

type SimulationLike = {
  id: string;
  packageId: string;
  status: string;
  clockSeconds: number;
  currentWaypointSeq: number;
  activeDecisionPointId: string | null;
  selectedTargetZoneId: string | null;
  activeBranchType: string | null;
  events?: AuditLike[];
};

export function serializePackage(pkg: PackageLike): LaunchPackageRecord {
  return {
    id: pkg.id,
    missionId: pkg.missionId,
    name: pkg.name,
    description: pkg.description,
    status: pkg.status,
    waypoints: (pkg.waypoints ?? []).sort((a, b) => a.sequence - b.sequence).map(serializeWaypoint),
    decisionPoints: (pkg.decisionPoints ?? []).map(serializeDecisionPoint),
    branchWaypoints: (pkg.branchWaypoints ?? [])
      .sort((a, b) => a.decisionTargetZoneId.localeCompare(b.decisionTargetZoneId) || normalizeBranchType(a.branchType).localeCompare(normalizeBranchType(b.branchType)) || a.branchSequence - b.branchSequence)
      .map(serializeBranchWaypoint),
    routeBranches: (pkg.routeBranches ?? []).map(serializeRouteBranch),
    warnings: (pkg.warnings ?? []).map(serializeWarning),
  };
}

export function serializeWaypoint(waypoint: WaypointLike): WaypointRecord {
  return {
    id: waypoint.id,
    packageId: waypoint.packageId,
    sequence: waypoint.sequence,
    behavior: normalizeWaypointBehavior(waypoint.behavior),
    name: waypoint.name,
    objective: waypoint.objective,
    lon: waypoint.lon,
    lat: waypoint.lat,
    altitudeM: waypoint.altitudeM,
    dwellSeconds: waypoint.dwellSeconds,
  };
}

export function serializeBranchWaypoint(waypoint: BranchWaypointLike): BranchWaypointRecord {
  return {
    id: waypoint.id,
    packageId: waypoint.packageId,
    decisionPointId: waypoint.decisionPointId,
    decisionTargetZoneId: waypoint.decisionTargetZoneId,
    branchType: normalizeBranchType(waypoint.branchType),
    branchSequence: waypoint.branchSequence,
    behavior: normalizeWaypointBehavior(waypoint.behavior),
    name: waypoint.name,
    objective: waypoint.objective,
    lon: waypoint.lon,
    lat: waypoint.lat,
    altitudeM: waypoint.altitudeM,
    dwellSeconds: waypoint.dwellSeconds,
  };
}

export function serializeDecisionPoint(decisionPoint: DecisionPointLike): DecisionPointRecord {
  return {
    id: decisionPoint.id,
    packageId: decisionPoint.packageId,
    waypointId: decisionPoint.waypointId,
    name: decisionPoint.name,
    targetZones: (decisionPoint.targetZones ?? []).map((zone) => ({
      id: zone.id,
      decisionPointId: zone.decisionPointId,
      name: zone.name,
      centerLon: zone.centerLon,
      centerLat: zone.centerLat,
      radiusM: zone.radiusM,
      allowedPps: parseJson<number[]>(zone.allowedPpsJson, [1, 2, 4, 8]),
    })),
  };
}

export function serializeRouteBranch(branch: RouteBranchLike): RouteBranchRecord {
  return {
    id: branch.id,
    packageId: branch.packageId,
    decisionPointId: branch.decisionPointId,
    type: normalizeBranchType(branch.type),
    name: branch.name,
    geometry: parseJson(branch.geometryJson, null),
  };
}

export function serializeWarning(warning: WarningLike): ValidationWarningRecord {
  return {
    id: warning.id,
    packageId: warning.packageId,
    code: warning.code,
    severity: warning.severity as ValidationWarningRecord["severity"],
    message: warning.message,
  };
}

export function serializeSimulation(simulation: SimulationLike): SimulationRecord {
  return {
    id: simulation.id,
    packageId: simulation.packageId,
    status: simulation.status as SimulationRecord["status"],
    clockSeconds: simulation.clockSeconds,
    currentWaypointSeq: simulation.currentWaypointSeq,
    activeDecisionPointId: simulation.activeDecisionPointId,
    selectedTargetZoneId: simulation.selectedTargetZoneId,
    activeBranchType: simulation.activeBranchType,
    auditLog: (simulation.events ?? []).map(serializeAuditLog),
  };
}

export function serializeAuditLog(event: AuditLike): AuditLogRecord {
  return {
    id: event.id,
    packageId: event.packageId,
    simulationId: event.simulationId,
    kind: event.kind,
    message: event.message,
    details: parseJson<Record<string, unknown>>(event.detailsJson, {}),
    createdAt: event.createdAt.toISOString(),
  };
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeWaypointBehavior(value: string): WaypointBehavior {
  if (value === "rtb") return "land";
  return value as WaypointBehavior;
}

function normalizeBranchType(value: string): BranchType {
  if (value === "rtb") return "land";
  return value as BranchType;
}
