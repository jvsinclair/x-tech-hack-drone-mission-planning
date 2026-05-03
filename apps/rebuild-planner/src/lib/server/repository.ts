/*
Module Context
Purpose:
- Own local SQLite persistence operations for launch-package planning and simulation.
Why This Exists:
- The rebuild has a proper backend server and keeps mutable planning state out of the browser.
Primary Inputs/Outputs:
- Inputs: Mission bootstrap payloads and operator API actions.
- Outputs: Serialized packages, simulations, warnings, and audit logs.
Research / Source Links:
- docs/PALANTIR_REBUILD_MASTER_PRD.md
Validated:
- provisional: Exercised by API handlers; pure PPS logic has direct tests.
Current Limits / TODO:
- Branch geometry authoring is seeded and minimal; richer branch editing can extend this repository.
Agent Maintenance Rule:
- Keep all server-side mutations local-only until Palantir write actions are confirmed.
*/

import { prisma } from "@/lib/server/db";
import { serializePackage, serializeSimulation } from "@/lib/server/serializers";
import { compileLaunchPackage } from "@/lib/simulation/compile";
import { actionLabel, evaluatePpsEvent } from "@/lib/simulation/pps";
import type { BranchType, BootstrapPayload, LaunchPackageRecord, StarterPackageSeed, WaypointBehavior } from "@/lib/types";

const packageInclude = {
  waypoints: true,
  decisionPoints: { include: { targetZones: true } },
  branchWaypoints: true,
  routeBranches: true,
  warnings: true,
} as const;

const simulationInclude = {
  events: { orderBy: { createdAt: "asc" as const } },
} as const;

const DEFAULT_ALTITUDE_M = 20;
const MAX_DECISION_ZONES = 4;
const MIN_BRANCH_READY_ZONES = 2;
const branchLabels: Record<BranchType, string> = {
  primary: "Primary",
  alternate: "Alternate",
  hold: "Hold",
  land: "Land",
};

export async function ensureMissionAndStarter(
  context: Omit<BootstrapPayload, "packages"> & { starterPackage: StarterPackageSeed },
): Promise<BootstrapPayload> {
  await prisma.mission.upsert({
    where: { id: context.mission.id },
    update: {
      name: context.mission.name,
      safetyScope: JSON.stringify(context.mission.safetyScope),
      source: context.mission.source,
    },
    create: {
      id: context.mission.id,
      name: context.mission.name,
      safetyScope: JSON.stringify(context.mission.safetyScope),
      source: context.mission.source,
    },
  });

  await prisma.palantirSourceCache.upsert({
    where: { id: `${context.mission.id}:bootstrap` },
    update: {
      payload: JSON.stringify({ layers: context.layers, sources: context.sources, bounds: context.mission.bounds }),
      source: context.mission.source,
    },
    create: {
      id: `${context.mission.id}:bootstrap`,
      payload: JSON.stringify({ layers: context.layers, sources: context.sources, bounds: context.mission.bounds }),
      source: context.mission.source,
    },
  });

  await ensureStarterPackage(context.mission.id, context.starterPackage);
  const packages = await listLaunchPackages(context.mission.id);

  return {
    mission: context.mission,
    layers: context.layers,
    sources: context.sources,
    packages,
  };
}

export async function listLaunchPackages(missionId?: string): Promise<LaunchPackageRecord[]> {
  const packages = await prisma.launchPackage.findMany({
    where: missionId ? { missionId } : undefined,
    include: packageInclude,
    orderBy: { createdAt: "asc" },
  });
  return packages.map(serializePackage);
}

export async function createLaunchPackage(missionId: string, name = "New launch package"): Promise<LaunchPackageRecord> {
  const created = await prisma.launchPackage.create({
    data: {
      id: crypto.randomUUID(),
      missionId,
      name,
      description: "Operator-authored surveillance route package.",
    },
    include: packageInclude,
  });
  await appendAuditEvent(created.id, null, "package_created", `${name} created.`, {});
  return serializePackage(created);
}

export async function addWaypoint(input: {
  packageId: string;
  behavior: WaypointBehavior;
  lon: number;
  lat: number;
  name?: string;
  objective?: string;
}): Promise<LaunchPackageRecord> {
  const nextSequence = (await prisma.droneWaypoint.count({ where: { packageId: input.packageId } })) + 1;
  const waypoint = await prisma.droneWaypoint.create({
    data: {
      id: crypto.randomUUID(),
      packageId: input.packageId,
      sequence: nextSequence,
      behavior: input.behavior,
      name: input.name ?? defaultWaypointName(input.behavior, nextSequence),
      objective: input.objective ?? "",
      lon: input.lon,
      lat: input.lat,
      altitudeM: DEFAULT_ALTITUDE_M,
    },
  });

  if (input.behavior === "decision") {
    await prisma.decisionPoint.create({
      data: {
        id: crypto.randomUUID(),
        packageId: input.packageId,
        waypointId: waypoint.id,
        name: `Decision ${nextSequence}`,
      },
    });
  }

  await appendAuditEvent(input.packageId, null, "waypoint_added", `${waypoint.name} placed.`, {
    behavior: input.behavior,
    sequence: nextSequence,
    lon: input.lon,
    lat: input.lat,
  });

  return getPackageOrThrow(input.packageId);
}

export async function addDecisionZone(input: {
  packageId: string;
  decisionPointId?: string;
  centerLon: number;
  centerLat: number;
  radiusM?: number;
}): Promise<LaunchPackageRecord> {
  const decisionPoint =
    (input.decisionPointId
      ? await prisma.decisionPoint.findUnique({ where: { id: input.decisionPointId } })
      : await prisma.decisionPoint.findFirst({ where: { packageId: input.packageId }, orderBy: { createdAt: "asc" } })) ??
    (await createDecisionPointFromLastWaypoint(input.packageId));

  const zoneNumber = (await prisma.decisionTargetZone.count({ where: { decisionPointId: decisionPoint.id } })) + 1;
  if (zoneNumber > MAX_DECISION_ZONES) {
    throw new Error(`A decision waypoint supports up to ${MAX_DECISION_ZONES} target zones.`);
  }
  const zone = await prisma.decisionTargetZone.create({
    data: {
      id: crypto.randomUUID(),
      decisionPointId: decisionPoint.id,
      name: `DTZ-${zoneNumber}`,
      centerLon: input.centerLon,
      centerLat: input.centerLat,
      radiusM: input.radiusM ?? 250,
      allowedPpsJson: JSON.stringify([1, 2, 4, 8]),
    },
  });

  await appendAuditEvent(input.packageId, null, "decision_zone_added", `${zone.name} placed.`, {
    decisionPointId: decisionPoint.id,
    centerLon: input.centerLon,
    centerLat: input.centerLat,
    radiusM: zone.radiusM,
  });

  return getPackageOrThrow(input.packageId);
}

export async function updateWaypoint(input: {
  waypointId: string;
  packageId: string;
  name?: string;
  behavior?: WaypointBehavior;
  objective?: string;
  altitudeM?: number | null;
  dwellSeconds?: number | null;
  lon?: number;
  lat?: number;
}): Promise<LaunchPackageRecord> {
  const existing = await prisma.droneWaypoint.findFirst({
    where: { id: input.waypointId, packageId: input.packageId },
  });
  if (!existing) throw new Error("Waypoint not found.");

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.behavior !== undefined) data.behavior = input.behavior;
  if (input.objective !== undefined) data.objective = input.objective;
  if (input.altitudeM !== undefined) data.altitudeM = input.altitudeM;
  if (input.dwellSeconds !== undefined) data.dwellSeconds = input.dwellSeconds;
  if (input.lon !== undefined) data.lon = input.lon;
  if (input.lat !== undefined) data.lat = input.lat;

  await prisma.droneWaypoint.update({ where: { id: input.waypointId }, data });

  if (input.behavior === "decision" && existing.behavior !== "decision") {
    await prisma.decisionPoint.create({
      data: {
        id: crypto.randomUUID(),
        packageId: input.packageId,
        waypointId: input.waypointId,
        name: `Decision ${existing.sequence}`,
      },
    });
  }

  if (input.behavior && input.behavior !== "decision" && existing.behavior === "decision") {
    const decisionPoints = await prisma.decisionPoint.findMany({ where: { waypointId: input.waypointId } });
    for (const point of decisionPoints) {
      await prisma.routeBranch.deleteMany({ where: { decisionPointId: point.id } });
      await prisma.decisionPoint.delete({ where: { id: point.id } });
    }
  }

  await appendAuditEvent(input.packageId, null, "waypoint_updated", `Waypoint updated.`, { waypointId: input.waypointId, fields: Object.keys(data) });
  return getPackageOrThrow(input.packageId);
}

export async function deleteWaypoint(input: {
  waypointId: string;
  packageId: string;
}): Promise<LaunchPackageRecord> {
  const waypoint = await prisma.droneWaypoint.findUnique({ where: { id: input.waypointId } });
  if (!waypoint) throw new Error("Waypoint not found.");

  // If decision waypoint, remove linked decision point (cascades to zones via schema)
  if (waypoint.behavior === "decision") {
    const decisionPoints = await prisma.decisionPoint.findMany({ where: { waypointId: waypoint.id } });
    for (const point of decisionPoints) {
      await prisma.routeBranch.deleteMany({ where: { decisionPointId: point.id } });
      await prisma.decisionPoint.delete({ where: { id: point.id } });
    }
  }

  await prisma.droneWaypoint.delete({ where: { id: input.waypointId } });

  // Resequence remaining waypoints
  const remaining = await prisma.droneWaypoint.findMany({
    where: { packageId: input.packageId },
    orderBy: { sequence: "asc" },
  });
  await resequenceWaypoints(remaining.map((waypoint) => waypoint.id));

  await appendAuditEvent(input.packageId, null, "waypoint_deleted", `${waypoint.name} deleted.`, { waypointId: input.waypointId, behavior: waypoint.behavior });
  return getPackageOrThrow(input.packageId);
}

export async function reorderWaypoints(input: {
  packageId: string;
  waypointIds: string[];
}): Promise<LaunchPackageRecord> {
  const current = await prisma.droneWaypoint.findMany({
    where: { packageId: input.packageId },
    select: { id: true },
    orderBy: { sequence: "asc" },
  });
  const currentIds = current.map((waypoint) => waypoint.id);
  const requested = [...input.waypointIds];
  if (requested.length !== currentIds.length || requested.some((id) => !currentIds.includes(id))) {
    throw new Error("Waypoint order must include every waypoint in the package.");
  }
  await resequenceWaypoints(requested);
  await appendAuditEvent(input.packageId, null, "waypoints_reordered", "Waypoints reordered.", { waypointIds: input.waypointIds });
  return getPackageOrThrow(input.packageId);
}

export async function updatePackage(input: {
  packageId: string;
  name?: string;
  description?: string;
  status?: string;
}): Promise<LaunchPackageRecord> {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.status !== undefined) data.status = input.status;
  await prisma.launchPackage.update({ where: { id: input.packageId }, data });
  await appendAuditEvent(input.packageId, null, "package_updated", "Package updated.", { fields: Object.keys(data) });
  return getPackageOrThrow(input.packageId);
}

export async function deletePackage(packageId: string): Promise<void> {
  await prisma.launchPackage.delete({ where: { id: packageId } });
}

export async function updateDecisionZone(input: {
  zoneId: string;
  packageId: string;
  name?: string;
  centerLon?: number;
  centerLat?: number;
  radiusM?: number;
  allowedPps?: number[];
}): Promise<LaunchPackageRecord> {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.centerLon !== undefined) data.centerLon = input.centerLon;
  if (input.centerLat !== undefined) data.centerLat = input.centerLat;
  if (input.radiusM !== undefined) data.radiusM = input.radiusM;
  if (input.allowedPps !== undefined) data.allowedPpsJson = JSON.stringify(input.allowedPps);
  await prisma.decisionTargetZone.update({ where: { id: input.zoneId }, data });
  await appendAuditEvent(input.packageId, null, "zone_updated", "Decision zone updated.", { zoneId: input.zoneId, fields: Object.keys(data) });
  return getPackageOrThrow(input.packageId);
}

export async function deleteDecisionZone(input: {
  zoneId: string;
  packageId: string;
}): Promise<LaunchPackageRecord> {
  await prisma.decisionTargetZone.delete({ where: { id: input.zoneId } });
  await appendAuditEvent(input.packageId, null, "zone_deleted", "Decision zone deleted.", { zoneId: input.zoneId });
  return getPackageOrThrow(input.packageId);
}

export async function addBranchWaypoint(input: {
  packageId: string;
  decisionPointId: string;
  decisionTargetZoneId: string;
  branchType: BranchType;
  lon: number;
  lat: number;
  behavior?: WaypointBehavior;
  name?: string;
  objective?: string;
}): Promise<LaunchPackageRecord> {
  const branchType = normalizeBranchType(input.branchType);
  const zone = await prisma.decisionTargetZone.findFirst({
    where: { id: input.decisionTargetZoneId, decisionPointId: input.decisionPointId },
    include: { decisionPoint: { include: { waypoint: true, targetZones: true } } },
  });
  if (!zone || zone.decisionPoint.packageId !== input.packageId) {
    throw new Error("Decision target zone not found for this package.");
  }
  if (zone.decisionPoint.targetZones.length < MIN_BRANCH_READY_ZONES) {
    throw new Error(`Add at least ${MIN_BRANCH_READY_ZONES} target zones before authoring branch waypoints.`);
  }

  const nextSequence =
    (await prisma.branchWaypoint.count({
      where: { decisionTargetZoneId: input.decisionTargetZoneId, branchType },
    })) + 1;
  const created = await prisma.branchWaypoint.create({
    data: {
      id: crypto.randomUUID(),
      packageId: input.packageId,
      decisionPointId: input.decisionPointId,
      decisionTargetZoneId: input.decisionTargetZoneId,
      branchType,
      branchSequence: nextSequence,
      behavior: input.behavior ?? defaultBranchWaypointBehavior(branchType),
      name: input.name ?? defaultBranchWaypointName(zone.decisionPoint.waypoint?.sequence ?? null, zone.name, branchType, nextSequence),
      objective: input.objective ?? "",
      lon: input.lon,
      lat: input.lat,
      altitudeM: DEFAULT_ALTITUDE_M,
    },
  });

  await appendAuditEvent(input.packageId, null, "branch_waypoint_added", `${created.name} placed.`, {
    decisionPointId: input.decisionPointId,
    decisionTargetZoneId: input.decisionTargetZoneId,
    branchType,
    branchSequence: nextSequence,
  });

  return getPackageOrThrow(input.packageId);
}

export async function updateBranchWaypoint(input: {
  branchWaypointId: string;
  packageId: string;
  name?: string;
  behavior?: WaypointBehavior;
  objective?: string;
  altitudeM?: number | null;
  dwellSeconds?: number | null;
  lon?: number;
  lat?: number;
}): Promise<LaunchPackageRecord> {
  const existing = await prisma.branchWaypoint.findFirst({
    where: { id: input.branchWaypointId, packageId: input.packageId },
  });
  if (!existing) throw new Error("Branch waypoint not found.");

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.behavior !== undefined) data.behavior = input.behavior;
  if (input.objective !== undefined) data.objective = input.objective;
  if (input.altitudeM !== undefined) data.altitudeM = input.altitudeM;
  if (input.dwellSeconds !== undefined) data.dwellSeconds = input.dwellSeconds;
  if (input.lon !== undefined) data.lon = input.lon;
  if (input.lat !== undefined) data.lat = input.lat;

  await prisma.branchWaypoint.update({ where: { id: input.branchWaypointId }, data });
  await appendAuditEvent(input.packageId, null, "branch_waypoint_updated", "Branch waypoint updated.", {
    branchWaypointId: input.branchWaypointId,
    fields: Object.keys(data),
  });
  return getPackageOrThrow(input.packageId);
}

export async function deleteBranchWaypoint(input: {
  branchWaypointId: string;
  packageId: string;
}): Promise<LaunchPackageRecord> {
  const existing = await prisma.branchWaypoint.findFirst({
    where: { id: input.branchWaypointId, packageId: input.packageId },
  });
  if (!existing) throw new Error("Branch waypoint not found.");

  await prisma.branchWaypoint.delete({ where: { id: input.branchWaypointId } });
  const remaining = await prisma.branchWaypoint.findMany({
    where: { decisionTargetZoneId: existing.decisionTargetZoneId, branchType: existing.branchType },
    orderBy: { branchSequence: "asc" },
  });
  await resequenceBranchWaypoints(remaining.map((waypoint) => waypoint.id));

  await appendAuditEvent(input.packageId, null, "branch_waypoint_deleted", `${existing.name} deleted.`, {
    branchWaypointId: input.branchWaypointId,
    branchType: existing.branchType,
  });
  return getPackageOrThrow(input.packageId);
}

export async function compileAndStoreWarnings(packageId: string): Promise<LaunchPackageRecord> {
  const pkg = await getPackageOrThrow(packageId);
  const warnings = compileLaunchPackage(pkg);
  await prisma.validationWarning.deleteMany({ where: { packageId } });
  await prisma.validationWarning.createMany({
    data: warnings.map((warning) => ({
      id: crypto.randomUUID(),
      packageId,
      ...warning,
    })),
  });
  await appendAuditEvent(packageId, null, "package_compiled", `Package compiled with ${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`, {
    warnings: warnings.map((warning) => warning.code),
  });
  return getPackageOrThrow(packageId);
}

export async function startSimulation(packageId: string) {
  const pkg = await getPackageOrThrow(packageId);
  const firstDecision = pkg.decisionPoints[0] ?? null;
  const simulation = await prisma.launchSimulation.create({
    data: {
      id: crypto.randomUUID(),
      packageId,
      status: "paused",
      currentWaypointSeq: pkg.waypoints[0]?.sequence ?? 1,
      activeDecisionPointId: null,
    },
    include: simulationInclude,
  });
  await appendAuditEvent(packageId, simulation.id, "simulation_started", "Launch package simulation started in manual-step mode.", {
    firstDecisionPointId: firstDecision?.id ?? null,
  });
  return getSimulationOrThrow(simulation.id);
}

export async function stepSimulation(simulationId: string) {
  const simulation = await prisma.launchSimulation.findUnique({ where: { id: simulationId } });
  if (!simulation) throw new Error("Simulation not found.");
  const pkg = await getPackageOrThrow(simulation.packageId);
  const maxSequence = Math.max(1, ...pkg.waypoints.map((waypoint) => waypoint.sequence));
  const nextSequence = Math.min(simulation.currentWaypointSeq + 1, maxSequence);
  const nextWaypoint = pkg.waypoints.find((waypoint) => waypoint.sequence === nextSequence);
  const decision = nextWaypoint ? pkg.decisionPoints.find((point) => point.waypointId === nextWaypoint.id) : undefined;
  const status = nextSequence >= maxSequence ? "complete" : decision ? "paused" : simulation.status;

  await prisma.launchSimulation.update({
    where: { id: simulationId },
    data: {
      clockSeconds: simulation.clockSeconds + 30,
      currentWaypointSeq: nextSequence,
      status,
      activeDecisionPointId: decision?.id ?? null,
    },
  });

  await appendAuditEvent(simulation.packageId, simulationId, decision ? "decision_pause" : "simulation_step", decision ? `${decision.name} reached. Awaiting PPS.` : `Advanced to waypoint ${nextSequence}.`, {
    currentWaypointSeq: nextSequence,
  });
  return getSimulationOrThrow(simulationId);
}

export async function controlSimulation(simulationId: string, action: "pause" | "resume" | "reset") {
  const simulation = await prisma.launchSimulation.findUnique({ where: { id: simulationId } });
  if (!simulation) throw new Error("Simulation not found.");
  const data =
    action === "reset"
      ? { status: "paused", clockSeconds: 0, currentWaypointSeq: 1, activeDecisionPointId: null, activeBranchType: null, selectedTargetZoneId: null }
      : { status: action === "resume" ? "playing" : "paused" };
  await prisma.launchSimulation.update({ where: { id: simulationId }, data });
  await appendAuditEvent(simulation.packageId, simulationId, `simulation_${action}`, `Simulation ${action}.`, {});
  return getSimulationOrThrow(simulationId);
}

export async function simulatePps(input: { simulationId: string; observedPps: number; targetZoneId?: string; aimLon?: number; aimLat?: number }) {
  const simulation = await prisma.launchSimulation.findUnique({ where: { id: input.simulationId } });
  if (!simulation) throw new Error("Simulation not found.");
  const pkg = await getPackageOrThrow(simulation.packageId);
  const zones = pkg.decisionPoints.flatMap((point) => point.targetZones);
  const selectedZone =
    (input.targetZoneId ? zones.find((zone) => zone.id === input.targetZoneId) : zones.find((zone) => zone.decisionPointId === simulation.activeDecisionPointId)) ?? null;
  const result = evaluatePpsEvent({
    observedPps: input.observedPps,
    activeDecisionPointId: simulation.activeDecisionPointId,
    selectedTargetZone: selectedZone,
    aimLon: input.aimLon ?? selectedZone?.centerLon ?? 0,
    aimLat: input.aimLat ?? selectedZone?.centerLat ?? 0,
  });

  if (result.accepted) {
    await prisma.launchSimulation.update({
      where: { id: input.simulationId },
      data: {
        status: "paused",
        selectedTargetZoneId: selectedZone?.id ?? null,
        activeBranchType: result.action,
      },
    });
    await appendAuditEvent(simulation.packageId, input.simulationId, "pps_accepted", result.message, {
      pps: result.pps,
      action: result.action,
      ruleId: result.ruleId,
    });
  } else {
    await appendAuditEvent(simulation.packageId, input.simulationId, "pps_rejected", result.message, {
      pps: input.observedPps,
      reason: result.reason,
      ruleId: result.ruleId,
    });
  }

  return getSimulationOrThrow(input.simulationId);
}

export async function recordClickstream(kind: string, target: string, payload: Record<string, unknown>) {
  await prisma.debugClickEvent.create({
    data: {
      id: crypto.randomUUID(),
      kind,
      target,
      payload: JSON.stringify(payload),
    },
  });
}

async function ensureStarterPackage(missionId: string, seed: StarterPackageSeed) {
  const existingCount = await prisma.launchPackage.count({ where: { missionId } });
  if (existingCount > 0 || seed.waypoints.length === 0) return;

  await prisma.$transaction(async (tx) => {
    const packageId = crypto.randomUUID();
    const pkg = await tx.launchPackage.create({
      data: {
        id: packageId,
        missionId,
        name: seed.name,
        description: seed.description,
      },
    });

    const createdWaypoints = [];
    for (const waypoint of seed.waypoints) {
      createdWaypoints.push(
        await tx.droneWaypoint.create({
          data: {
            id: crypto.randomUUID(),
            packageId: pkg.id,
            sequence: waypoint.sequence,
            behavior: waypoint.behavior,
            name: waypoint.name,
            objective: waypoint.objective,
            lon: waypoint.lon,
            lat: waypoint.lat,
            altitudeM: waypoint.altitudeM,
            dwellSeconds: waypoint.dwellSeconds,
          },
        }),
      );
    }

    const decisionWaypoint = createdWaypoints.find((waypoint) => waypoint.behavior === "decision") ?? createdWaypoints[2];
    if (decisionWaypoint) {
      const decision = await tx.decisionPoint.create({
        data: {
          id: crypto.randomUUID(),
          packageId: pkg.id,
          waypointId: decisionWaypoint.id,
          name: "Decision Alpha",
        },
      });

      if (seed.decisionZone) {
        await tx.decisionTargetZone.create({
          data: {
            id: crypto.randomUUID(),
            decisionPointId: decision.id,
            name: "DTZ-1",
            centerLon: seed.decisionZone.centerLon,
            centerLat: seed.decisionZone.centerLat,
            radiusM: seed.decisionZone.radiusM,
            allowedPpsJson: JSON.stringify([1, 2, 4, 8]),
          },
        });
      }

      const launch = createdWaypoints[0] ?? decisionWaypoint;
      const afterDecision = createdWaypoints.find((waypoint) => waypoint.sequence > decisionWaypoint.sequence) ?? decisionWaypoint;
      await tx.routeBranch.createMany({
        data: [
          branchSeed(pkg.id, decision.id, "primary", "Primary route", [
            [decisionWaypoint.lon, decisionWaypoint.lat],
            [afterDecision.lon, afterDecision.lat],
          ]),
          branchSeed(pkg.id, decision.id, "alternate", "Alternate route", [
            [decisionWaypoint.lon, decisionWaypoint.lat],
            [decisionWaypoint.lon + 0.006, decisionWaypoint.lat + 0.011],
            [afterDecision.lon, afterDecision.lat],
          ]),
          branchSeed(pkg.id, decision.id, "hold", "Hold orbit", [
            [decisionWaypoint.lon, decisionWaypoint.lat],
            [decisionWaypoint.lon + 0.002, decisionWaypoint.lat + 0.002],
          ]),
          branchSeed(pkg.id, decision.id, "land", "Land route", [
            [decisionWaypoint.lon, decisionWaypoint.lat],
            [launch.lon, launch.lat],
          ]),
        ],
      });
    }

    await tx.auditLogEvent.create({
      data: {
        id: crypto.randomUUID(),
        packageId: pkg.id,
        kind: "starter_seeded",
        message: "Starter launch package seeded for the judge path.",
        detailsJson: JSON.stringify({ missionId }),
      },
    });
  });
}

async function getPackageOrThrow(packageId: string): Promise<LaunchPackageRecord> {
  const pkg = await prisma.launchPackage.findUnique({
    where: { id: packageId },
    include: packageInclude,
  });
  if (!pkg) throw new Error("Launch package not found.");
  return serializePackage(pkg);
}

async function getSimulationOrThrow(simulationId: string) {
  const simulation = await prisma.launchSimulation.findUnique({
    where: { id: simulationId },
    include: simulationInclude,
  });
  if (!simulation) throw new Error("Simulation not found.");
  return serializeSimulation(simulation);
}

async function appendAuditEvent(packageId: string, simulationId: string | null, kind: string, message: string, details: Record<string, unknown>) {
  await prisma.auditLogEvent.create({
    data: {
      id: crypto.randomUUID(),
      packageId,
      simulationId,
      kind,
      message,
      detailsJson: JSON.stringify(details),
    },
  });
}

async function resequenceWaypoints(waypointIds: string[]) {
  await prisma.$transaction(async (tx) => {
    for (let index = 0; index < waypointIds.length; index++) {
      await tx.droneWaypoint.update({ where: { id: waypointIds[index] }, data: { sequence: 10000 + index } });
    }
    for (let index = 0; index < waypointIds.length; index++) {
      await tx.droneWaypoint.update({ where: { id: waypointIds[index] }, data: { sequence: index + 1 } });
    }
  });
}

async function createDecisionPointFromLastWaypoint(packageId: string) {
  const waypoint = await prisma.droneWaypoint.findFirst({ where: { packageId }, orderBy: { sequence: "desc" } });
  if (waypoint?.behavior !== "decision") {
    const next = (await prisma.droneWaypoint.count({ where: { packageId } })) + 1;
    const createdWaypoint = await prisma.droneWaypoint.create({
      data: {
        id: crypto.randomUUID(),
        packageId,
        sequence: next,
        behavior: "decision",
        name: `Decision ${next}`,
        lon: waypoint?.lon ?? -121.842,
        lat: waypoint?.lat ?? 37.538,
        altitudeM: DEFAULT_ALTITUDE_M,
      },
    });
    return prisma.decisionPoint.create({
      data: {
        id: crypto.randomUUID(),
        packageId,
        waypointId: createdWaypoint.id,
        name: `Decision ${next}`,
      },
    });
  }
  return prisma.decisionPoint.create({
    data: {
      id: crypto.randomUUID(),
      packageId,
      waypointId: waypoint.id,
      name: `Decision ${waypoint.sequence}`,
    },
  });
}

function branchSeed(packageId: string, decisionPointId: string, type: BranchType, name: string, coordinates: number[][]) {
  return {
    id: crypto.randomUUID(),
    packageId,
    decisionPointId,
    type,
    name,
    geometryJson: JSON.stringify({ type: "LineString", coordinates }),
  };
}

function defaultWaypointName(behavior: WaypointBehavior, sequence: number): string {
  const labels: Record<WaypointBehavior, string> = {
    launch: "Launch",
    transit: "Transit",
    scout: "Scout",
    scan_area: "Scan Area",
    observe: "Observe",
    hold_loiter: "Hold",
    decision: "Decision",
    land: "Land",
    abort: "Abort",
  };
  return `${labels[behavior]} ${sequence}`;
}

async function resequenceBranchWaypoints(branchWaypointIds: string[]) {
  await prisma.$transaction(async (tx) => {
    for (let index = 0; index < branchWaypointIds.length; index++) {
      await tx.branchWaypoint.update({ where: { id: branchWaypointIds[index] }, data: { branchSequence: 10000 + index } });
    }
    for (let index = 0; index < branchWaypointIds.length; index++) {
      await tx.branchWaypoint.update({ where: { id: branchWaypointIds[index] }, data: { branchSequence: index + 1 } });
    }
  });
}

function defaultBranchWaypointBehavior(branchType: BranchType): WaypointBehavior {
  if (branchType === "hold") return "hold_loiter";
  if (branchType === "land") return "land";
  return "transit";
}

function defaultBranchWaypointName(decisionSequence: number | null, zoneName: string, branchType: BranchType, sequence: number): string {
  const decisionLabel = decisionSequence ? `WP${decisionSequence}` : "Decision";
  return `${decisionLabel} ${zoneName} - ${branchLabels[branchType]} ${sequence}`;
}

function normalizeBranchType(branchType: BranchType | "rtb"): BranchType {
  return branchType === "rtb" ? "land" : branchType;
}
