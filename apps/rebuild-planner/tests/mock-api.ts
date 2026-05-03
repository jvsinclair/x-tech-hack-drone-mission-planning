import type { LaunchPackageRecord, SimulationRecord, WaypointBehavior } from "@/lib/types";
import { bootstrapFixture, packageFixture, simulationFixture } from "./fixtures";

export type MockState = {
  packages: LaunchPackageRecord[];
  currentSimulation: SimulationRecord | null;
  clickstream: Array<{ kind: string; target: string; payload: Record<string, unknown> }>;
};

let state: MockState;

export function resetMockState(overrides?: Partial<MockState>): MockState {
  state = {
    packages: [packageFixture()],
    currentSimulation: null,
    clickstream: [],
    ...overrides,
  };
  return state;
}

export function getMockState(): MockState {
  return state;
}

export function activePackage(): LaunchPackageRecord {
  return state.packages[0];
}

function updatePackageInState(pkg: LaunchPackageRecord) {
  state.packages = state.packages.map((p) => (p.id === pkg.id ? pkg : p));
}

export function json(payload: unknown, status = 200): Promise<Response> {
  return Promise.resolve(new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } }));
}

export async function fetchMock(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = String(input);
  const method = init?.method ?? "GET";
  const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {};

  // Debug clickstream -- always OK
  if (url.startsWith("/api/debug")) {
    state.clickstream.push(body as { kind: string; target: string; payload: Record<string, unknown> });
    return json({ ok: true });
  }

  // Bootstrap
  if (url.startsWith("/api/bootstrap")) return json(bootstrapFixture(activePackage()));

  // --- Launch packages collection ---
  if (url === "/api/launch-packages" && method === "POST") {
    const newPkg = packageFixture({
      id: "pkg-new",
      name: (body.name as string) ?? "Launch package 2",
      waypoints: [],
      decisionPoints: [],
      routeBranches: [],
      warnings: [],
    });
    state.packages.push(newPkg);
    return json({ package: newPkg }, 201);
  }

  // --- Single package PATCH / DELETE ---
  const packageMatch = url.match(/^\/api\/launch-packages\/([\w-]+)$/);
  if (packageMatch) {
    const pkg = state.packages.find((p) => p.id === packageMatch[1]);
    if (!pkg) return json({ error: "not found" }, 404);
    if (method === "PATCH") {
      const updated = { ...pkg, ...(body as Partial<LaunchPackageRecord>) };
      updatePackageInState(updated);
      return json({ package: updated });
    }
    if (method === "DELETE") {
      state.packages = state.packages.filter((p) => p.id !== packageMatch[1]);
      return json({ ok: true });
    }
  }

  // --- Waypoint resequence ---
  if (url.includes("/waypoints/resequence") && method === "POST") {
    const pkg = activePackage();
    const waypointIds = body.waypointIds as string[];
    const resequenced = waypointIds.map((id, i) => {
      const wp = pkg.waypoints.find((w) => w.id === id)!;
      return { ...wp, sequence: i + 1 };
    });
    const updated = { ...pkg, waypoints: resequenced };
    updatePackageInState(updated);
    return json({ package: updated });
  }

  // --- Single waypoint PATCH / DELETE ---
  const waypointMatch = url.match(/\/waypoints\/([\w-]+)$/);
  if (waypointMatch && (method === "PATCH" || method === "DELETE")) {
    const pkg = activePackage();
    if (method === "PATCH") {
      const updated = {
        ...pkg,
        waypoints: pkg.waypoints.map((wp) => (wp.id === waypointMatch[1] ? { ...wp, ...body } : wp)),
      };
      updatePackageInState(updated);
      return json({ package: updated });
    }
    if (method === "DELETE") {
      const deletedWp = pkg.waypoints.find((wp) => wp.id === waypointMatch[1]);
      const remainingWaypoints = pkg.waypoints
        .filter((wp) => wp.id !== waypointMatch[1])
        .map((wp, i) => ({ ...wp, sequence: i + 1 }));
      let decisionPoints = pkg.decisionPoints;
      if (deletedWp?.behavior === "decision") {
        decisionPoints = decisionPoints.filter((dp) => dp.waypointId !== deletedWp.id);
      }
      const updated = { ...pkg, waypoints: remainingWaypoints, decisionPoints };
      updatePackageInState(updated);
      return json({ package: updated });
    }
  }

  // --- Waypoints POST (add waypoint) ---
  if (url.includes("/waypoints") && method === "POST") {
    const pkg = activePackage();
    const wpBody = body as { behavior: WaypointBehavior; lon: number; lat: number; name: string };
    const waypoint = {
      id: `wp-${pkg.waypoints.length + 1}`,
      packageId: pkg.id,
      sequence: pkg.waypoints.length + 1,
      behavior: wpBody.behavior,
      name: wpBody.name,
      objective: "",
      lon: wpBody.lon,
      lat: wpBody.lat,
      altitudeM: 120,
      dwellSeconds: null,
    };
    let decisionPoints = pkg.decisionPoints;
    if (wpBody.behavior === "decision") {
      decisionPoints = [
        ...decisionPoints,
        { id: "decision-new", packageId: pkg.id, waypointId: waypoint.id, name: "Decision new", targetZones: [] },
      ];
    }
    const updated = { ...pkg, waypoints: [...pkg.waypoints, waypoint], decisionPoints };
    updatePackageInState(updated);
    return json({ package: updated }, 201);
  }

  // --- Single decision zone PATCH / DELETE ---
  const zoneMatch = url.match(/\/decision-zones\/([\w-]+)$/);
  if (zoneMatch && (method === "PATCH" || method === "DELETE")) {
    const pkg = activePackage();
    if (method === "PATCH") {
      const updated = {
        ...pkg,
        decisionPoints: pkg.decisionPoints.map((dp) => ({
          ...dp,
          targetZones: dp.targetZones.map((z) => (z.id === zoneMatch[1] ? { ...z, ...body } : z)),
        })),
      };
      updatePackageInState(updated);
      return json({ package: updated });
    }
    if (method === "DELETE") {
      const updated = {
        ...pkg,
        decisionPoints: pkg.decisionPoints.map((dp) => ({
          ...dp,
          targetZones: dp.targetZones.filter((z) => z.id !== zoneMatch[1]),
        })),
      };
      updatePackageInState(updated);
      return json({ package: updated });
    }
  }

  // --- Decision zones POST (add zone) ---
  if (url.includes("/decision-zones") && method === "POST") {
    const pkg = activePackage();
    const zBody = body as { centerLon: number; centerLat: number; radiusM?: number; decisionPointId?: string };
    const dp = (zBody.decisionPointId ? pkg.decisionPoints.find((point) => point.id === zBody.decisionPointId) : null) ?? pkg.decisionPoints[0];
    if (!dp) return json({ error: "no decision point" }, 422);
    const nextIndex = dp.targetZones.length + 1;
    const zone = {
      id: `zone-${nextIndex}`,
      decisionPointId: dp.id,
      name: `DTZ-${nextIndex}`,
      centerLon: zBody.centerLon,
      centerLat: zBody.centerLat,
      radiusM: zBody.radiusM ?? 250,
      allowedPps: [1, 2, 4, 8],
    };
    const updated = {
      ...pkg,
      decisionPoints: pkg.decisionPoints.map((d) =>
        d.id === dp.id ? { ...d, targetZones: [...d.targetZones, zone] } : d,
      ),
    };
    updatePackageInState(updated);
    return json({ package: updated }, 201);
  }

  // --- Compile ---
  if (url.includes("/compile")) return json({ package: activePackage() });

  // --- Simulations ---
  if (url === "/api/simulations" && method === "POST") {
    state.currentSimulation = simulationFixture((body.packageId as string) ?? activePackage().id);
    return json({ simulation: state.currentSimulation }, 201);
  }
  if (url.includes("/step")) {
    state.currentSimulation = {
      ...simulationFixture(activePackage().id),
      ...state.currentSimulation,
      currentWaypointSeq: 2,
      activeDecisionPointId: "decision-1",
      auditLog: [{ id: "audit-step", packageId: activePackage().id, simulationId: "sim-1", kind: "decision_pause", message: "Decision Alpha reached. Awaiting PPS.", details: {}, createdAt: new Date().toISOString() }],
    };
    return json({ simulation: state.currentSimulation });
  }
  if (url.includes("/pps")) {
    const ppsBranch: Record<number, string> = { 1: "hold", 2: "rtb", 4: "primary", 8: "alternate" };
    const ppsValue = (body.observedPps as number) ?? 4;
    const branchType = ppsBranch[ppsValue] ?? "primary";
    state.currentSimulation = {
      ...simulationFixture(activePackage().id),
      ...state.currentSimulation,
      activeBranchType: branchType,
      auditLog: [
        ...(state.currentSimulation?.auditLog ?? []),
        { id: `audit-pps-${ppsValue}`, packageId: activePackage().id, simulationId: "sim-1", kind: "pps_accepted", message: `${ppsValue} PPS accepted: ${branchType} route selected.`, details: {}, createdAt: new Date().toISOString() },
      ],
    };
    return json({ simulation: state.currentSimulation });
  }
  if (url.includes("/control")) {
    const action = body.action as string;
    if (action === "reset") {
      state.currentSimulation = simulationFixture(activePackage().id);
    } else if (state.currentSimulation) {
      state.currentSimulation = { ...state.currentSimulation, status: action === "resume" ? "playing" : "paused" };
    }
    return json({ simulation: state.currentSimulation ?? simulationFixture(activePackage().id) });
  }

  return json({}, 404);
}
