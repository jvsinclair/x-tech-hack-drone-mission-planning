"use client";

/*
Module Context
Purpose:
- Provide the rebuild planner's map-first tactical UI.
Why This Exists:
- The current app drifted toward a corporate dashboard; this shell centers authoring and simulation around the map.
Primary Inputs/Outputs:
- Inputs: Local API responses for bootstrap, packages, and simulation state.
- Outputs: Operator clicks that create waypoints, target zones, simulations, and audit/debug events.
Research / Source Links:
- docs/PALANTIR_REBUILD_MASTER_PRD.md
Validated:
- tested: apps/rebuild-planner/tests/planner-shell.test.tsx exercises key click paths.
Current Limits / TODO:
- Package editing is integrated into the field rail; full branch drawing is next-phase.
Agent Maintenance Rule:
- Keep Plan and Run controls separated; do not expose real drone or kinetic actions.
*/

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { TacticalCesiumMap } from "@/components/TacticalCesiumMap";
import { WaypointGlyph } from "@/components/WaypointGlyph";
import { formatLatLon, formatMgrs } from "@/lib/coordinates";
import { behaviorByType, waypointBehaviors } from "@/lib/symbology/isr";
import type { BranchType, BranchWaypointRecord, BootstrapPayload, DecisionPointRecord, DecisionTargetZoneRecord, LaunchPackageRecord, MissionLayers, MissionSummary, SimulationRecord, WaypointBehavior, WaypointRecord } from "@/lib/types";

type Mode = "plan" | "run";
type AssetSource = "auto" | "palantir" | "local";
type MapMode = "terrain3d" | "topo2d";
type PlacementMode = WaypointBehavior | "decision_zone" | null;
type ActiveBranchContext = { decisionPointId: string; zoneId: string; branchType: BranchType } | null;

const branchButtons: Array<{ type: BranchType; label: string; shortLabel: string }> = [
  { type: "primary", label: "Primary", shortLabel: "PRI" },
  { type: "alternate", label: "Alternate", shortLabel: "ALT" },
  { type: "hold", label: "Hold", shortLabel: "HLD" },
  { type: "land", label: "Land", shortLabel: "LND" },
];

export function PlannerShell() {
  const [mission, setMission] = useState<MissionSummary | null>(null);
  const [layers, setLayers] = useState<MissionLayers | null>(null);
  const [packages, setPackages] = useState<LaunchPackageRecord[]>([]);
  const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null);
  const [selectedBranchWaypointId, setSelectedBranchWaypointId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [placementMode, setPlacementMode] = useState<PlacementMode>(null);
  const [activeBranchContext, setActiveBranchContext] = useState<ActiveBranchContext>(null);
  const [mode, setMode] = useState<Mode>("plan");
  const [assetSource, setAssetSource] = useState<AssetSource>("palantir");
  const [mapMode, setMapMode] = useState<MapMode>("terrain3d");
  const [simulation, setSimulation] = useState<SimulationRecord | null>(null);
  const [status, setStatus] = useState("Bootstrapping mission context");
  const [pendingDeletePkgId, setPendingDeletePkgId] = useState<string | null>(null);
  const [renamingPackageId, setRenamingPackageId] = useState<string | null>(null);
  const [pendingZoneDecisionPointId, setPendingZoneDecisionPointId] = useState<string | null>(null);

  useEffect(() => {
    void loadBootstrap(assetSource);
  }, [assetSource]);

  const activePackage = useMemo(() => packages.find((pkg) => pkg.id === expandedPackageId) ?? packages[0] ?? null, [expandedPackageId, packages]);
  const selectedWaypoint = activePackage?.waypoints.find((waypoint) => waypoint.id === selectedWaypointId) ?? null;
  const selectedBranchWaypoint = activePackage?.branchWaypoints.find((waypoint) => waypoint.id === selectedBranchWaypointId) ?? null;
  const selectedZone = activePackage?.decisionPoints.flatMap((point) => point.targetZones).find((zone) => zone.id === selectedZoneId) ?? null;
  const selectedZoneDecisionPoint = selectedZone
    ? activePackage?.decisionPoints.find((point) => point.id === selectedZone.decisionPointId) ?? null
    : null;
  const selectedWaypointDecisionPoint = selectedWaypoint
    ? activePackage?.decisionPoints.find((point) => point.waypointId === selectedWaypoint.id) ?? null
    : null;
  const pendingZoneDecisionPoint =
    activePackage?.decisionPoints.find((point) => point.id === pendingZoneDecisionPointId) ?? selectedWaypointDecisionPoint ?? activePackage?.decisionPoints[0] ?? null;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (mode !== "plan" || (!selectedWaypointId && !selectedBranchWaypointId) || isTextEntryTarget(event.target)) return;
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      event.preventDefault();
      if (selectedBranchWaypointId) {
        void handleDeleteBranchWaypoint(selectedBranchWaypointId);
      } else if (selectedWaypointId) {
        void handleDeleteWaypoint(selectedWaypointId);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activePackage?.id, mode, selectedBranchWaypointId, selectedWaypointId]);

  async function loadBootstrap(source: AssetSource) {
    try {
      setStatus("Loading mission context");
      const token = typeof window !== "undefined" ? window.localStorage.getItem("foundryBearerToken") : null;
      const response = await fetch(`/api/bootstrap?source=${source}`, {
        headers: token ? { "x-foundry-token": token } : undefined,
      });
      if (!response.ok) {
        throw new Error(`Mission context failed to load (${response.status})`);
      }
      const payload = (await response.json()) as BootstrapPayload;
      setMission(payload.mission);
      setLayers(payload.layers);
      setPackages(payload.packages);
      setExpandedPackageId((current) => current ?? payload.packages[0]?.id ?? null);
      setPendingZoneDecisionPointId(null);
      setActiveBranchContext(null);
      setSelectedBranchWaypointId(null);
      setStatus(payload.mission.providerMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mission context failed to load";
      setStatus(message);
      void recordUi("error", "bootstrap", { message });
    }
  }

  async function createPackage() {
    if (!mission) return;
    await recordUi("click", "create_package", {});
    const response = await fetch("/api/launch-packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missionId: mission.id, name: `Launch package ${packages.length + 1}` }),
    });
    const payload = (await response.json()) as { package: LaunchPackageRecord };
    setPackages((current) => [...current, payload.package]);
    setExpandedPackageId(payload.package.id);
    setSelectedWaypointId(null);
    setSelectedBranchWaypointId(null);
    setSelectedZoneId(null);
    setPendingZoneDecisionPointId(null);
    setPlacementMode(null);
    setActiveBranchContext(null);
    setStatus(`${payload.package.name} ready for waypoint placement`);
  }

  async function handleMapPlacement(lon: number, lat: number) {
    if (!activePackage) return;
    const branchContext = activeBranchContext;
    if (branchContext && placementMode !== "decision_zone") {
      const behavior = placementMode ? behaviorByType[placementMode] : null;
      const response = await fetch(`/api/launch-packages/${activePackage.id}/branch-waypoints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisionPointId: branchContext.decisionPointId,
          decisionTargetZoneId: branchContext.zoneId,
          branchType: branchContext.branchType,
          behavior: placementMode ?? undefined,
          lon,
          lat,
        }),
      });
      const payload = (await response.json()) as { package: LaunchPackageRecord };
      updatePackageState(payload.package);
      const newest = newestBranchWaypoint(payload.package, branchContext);
      setSelectedBranchWaypointId(newest?.id ?? null);
      setSelectedWaypointId(null);
      setSelectedZoneId(branchContext.zoneId);
      const branchLabel = branchButtons.find((branch) => branch.type === branchContext.branchType)?.label ?? branchContext.branchType;
      setStatus(`${branchLabel} branch ${behavior?.label ?? "waypoint"} placed from the decision point`);
      await recordUi("map_placement", `branch_${branchContext.branchType}`, { behavior: placementMode ?? "default", lon, lat, zoneId: branchContext.zoneId });
      return;
    }
    if (!placementMode) return;
    if (placementMode === "decision_zone") {
      const decisionPointId = pendingZoneDecisionPoint?.id;
      if (!decisionPointId) {
        setStatus("Add or select a decision waypoint before placing a target zone");
        return;
      }
      const currentZoneCount = pendingZoneDecisionPoint.targetZones.length;
      if (currentZoneCount >= 4) {
        setStatus("A decision waypoint can have up to 4 target zones");
        return;
      }
      const response = await fetch(`/api/launch-packages/${activePackage.id}/decision-zones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionPointId, centerLon: lon, centerLat: lat, radiusM: 250 }),
      });
      const payload = (await response.json()) as { package: LaunchPackageRecord };
      updatePackageState(payload.package);
      const newestZone = payload.package.decisionPoints.flatMap((point) => point.targetZones).at(-1);
      setSelectedZoneId(newestZone?.id ?? null);
      setSelectedBranchWaypointId(null);
      if (newestZone) maybeArmBranchContext(payload.package, newestZone.id, "primary");
      setStatus("Decision target zone placed");
    } else {
      const behavior = behaviorByType[placementMode];
      const response = await fetch(`/api/launch-packages/${activePackage.id}/waypoints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ behavior: placementMode, lon, lat, name: `${behavior.label} ${activePackage.waypoints.length + 1}` }),
      });
      const payload = (await response.json()) as { package: LaunchPackageRecord };
      const newest = payload.package.waypoints.at(-1);
      updatePackageState(payload.package);
      setSelectedWaypointId(newest?.id ?? null);
      setSelectedBranchWaypointId(null);
      setSelectedZoneId(null);
      setActiveBranchContext(null);
      if (placementMode === "decision" && newest) {
        const decisionPoint = payload.package.decisionPoints.find((point) => point.waypointId === newest.id);
        setPendingZoneDecisionPointId(decisionPoint?.id ?? null);
        setPlacementMode("decision_zone");
        setStatus("Decision waypoint placed. Click map to add target zone.");
      } else {
        setPendingZoneDecisionPointId(null);
        setPlacementMode(null);
        setStatus(`${behavior.label} waypoint placed`);
      }
    }
    await recordUi("map_placement", String(placementMode), { lon, lat });
  }

  async function handleUpdateWaypoint(waypointId: string, fields: Partial<WaypointRecord>) {
    if (!activePackage) return;
    const response = await fetch(`/api/launch-packages/${activePackage.id}/waypoints/${waypointId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const payload = (await response.json()) as { package: LaunchPackageRecord };
    updatePackageState(payload.package);
    setStatus("Waypoint updated");
    void recordUi("click", "waypoint_update", { waypointId });
  }

  async function handleMoveWaypoint(waypointId: string, lon: number, lat: number) {
    if (!activePackage) return;
    setPackages((current) =>
      current.map((pkg) =>
        pkg.id === activePackage.id
          ? {
              ...pkg,
              waypoints: pkg.waypoints.map((waypoint) => (waypoint.id === waypointId ? { ...waypoint, lon, lat } : waypoint)),
            }
          : pkg,
      ),
    );
    const response = await fetch(`/api/launch-packages/${activePackage.id}/waypoints/${waypointId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lon, lat }),
    });
    const payload = (await response.json()) as { package: LaunchPackageRecord };
    updatePackageState(payload.package);
    setStatus("Waypoint moved");
    void recordUi("drag", "waypoint_move", { waypointId, lon, lat });
  }

  async function handleUpdateBranchWaypoint(branchWaypointId: string, fields: Partial<BranchWaypointRecord>) {
    if (!activePackage) return;
    const response = await fetch(`/api/launch-packages/${activePackage.id}/branch-waypoints/${branchWaypointId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const payload = (await response.json()) as { package: LaunchPackageRecord };
    updatePackageState(payload.package);
    setStatus("Branch waypoint updated");
    void recordUi("click", "branch_waypoint_update", { branchWaypointId });
  }

  async function handleMoveBranchWaypoint(branchWaypointId: string, lon: number, lat: number) {
    if (!activePackage) return;
    setPackages((current) =>
      current.map((pkg) =>
        pkg.id === activePackage.id
          ? {
              ...pkg,
              branchWaypoints: pkg.branchWaypoints.map((waypoint) => (waypoint.id === branchWaypointId ? { ...waypoint, lon, lat } : waypoint)),
            }
          : pkg,
      ),
    );
    const response = await fetch(`/api/launch-packages/${activePackage.id}/branch-waypoints/${branchWaypointId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lon, lat }),
    });
    const payload = (await response.json()) as { package: LaunchPackageRecord };
    updatePackageState(payload.package);
    setStatus("Branch waypoint moved");
    void recordUi("drag", "branch_waypoint_move", { branchWaypointId, lon, lat });
  }

  async function handleDeleteWaypoint(waypointId: string) {
    if (!activePackage) return;
    const response = await fetch(`/api/launch-packages/${activePackage.id}/waypoints/${waypointId}`, {
      method: "DELETE",
    });
    const payload = (await response.json()) as { package: LaunchPackageRecord };
    updatePackageState(payload.package);
    setSelectedWaypointId(null);
    setStatus("Waypoint deleted");
    void recordUi("click", "waypoint_delete", { waypointId });
  }

  async function handleDeleteBranchWaypoint(branchWaypointId: string) {
    if (!activePackage) return;
    const response = await fetch(`/api/launch-packages/${activePackage.id}/branch-waypoints/${branchWaypointId}`, {
      method: "DELETE",
    });
    const payload = (await response.json()) as { package: LaunchPackageRecord };
    updatePackageState(payload.package);
    setSelectedBranchWaypointId(null);
    setStatus("Branch waypoint deleted");
    void recordUi("click", "branch_waypoint_delete", { branchWaypointId });
  }

  async function handleResequence(waypointIds: string[]) {
    if (!activePackage) return;
    const response = await fetch(`/api/launch-packages/${activePackage.id}/waypoints/resequence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waypointIds }),
    });
    const payload = (await response.json()) as { package: LaunchPackageRecord };
    updatePackageState(payload.package);
    setStatus("Waypoints reordered");
  }

  async function handleRenamePackage(packageId: string, name: string) {
    const response = await fetch(`/api/launch-packages/${packageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const payload = (await response.json()) as { package: LaunchPackageRecord };
    updatePackageState(payload.package);
    setRenamingPackageId(null);
    setStatus(`Package renamed to ${name}`);
    void recordUi("click", "package_rename", { packageId, name });
  }

  async function handleDeletePackage(packageId: string) {
    await fetch(`/api/launch-packages/${packageId}`, { method: "DELETE" });
    setPackages((current) => current.filter((p) => p.id !== packageId));
    setPendingDeletePkgId(null);
    if (expandedPackageId === packageId) {
      const remaining = packages.filter((p) => p.id !== packageId);
      setExpandedPackageId(remaining[0]?.id ?? null);
    }
    setSelectedWaypointId(null);
    setSelectedBranchWaypointId(null);
    setSelectedZoneId(null);
    setActiveBranchContext(null);
    setStatus("Package deleted");
    void recordUi("click", "package_delete", { packageId });
  }

  async function handleUpdateZone(zoneId: string, fields: Partial<DecisionTargetZoneRecord>) {
    if (!activePackage) return;
    const response = await fetch(`/api/launch-packages/${activePackage.id}/decision-zones/${zoneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const payload = (await response.json()) as { package: LaunchPackageRecord };
    updatePackageState(payload.package);
    setStatus("Zone updated");
    void recordUi("click", "zone_update", { zoneId });
  }

  async function handleDeleteZone(zoneId: string) {
    if (!activePackage) return;
    const response = await fetch(`/api/launch-packages/${activePackage.id}/decision-zones/${zoneId}`, {
      method: "DELETE",
    });
    const payload = (await response.json()) as { package: LaunchPackageRecord };
    updatePackageState(payload.package);
    setSelectedZoneId(null);
    setSelectedBranchWaypointId(null);
    setActiveBranchContext(null);
    setStatus("Zone deleted");
    void recordUi("click", "zone_delete", { zoneId });
  }

  async function compilePackage() {
    if (!activePackage) return;
    const response = await fetch(`/api/launch-packages/${activePackage.id}/compile`, { method: "POST" });
    const payload = (await response.json()) as { package: LaunchPackageRecord };
    updatePackageState(payload.package);
    setStatus(`Compiled ${payload.package.name}`);
  }

  async function startSimulation() {
    if (!activePackage) return;
    const response = await fetch("/api/simulations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId: activePackage.id }),
    });
    const payload = (await response.json()) as { simulation: SimulationRecord };
    setSimulation(payload.simulation);
    setMode("run");
    setStatus("Simulation started in manual-step mode");
  }

  async function simulationAction(action: "pause" | "resume" | "reset" | "step") {
    if (!simulation) return;
    const endpoint = action === "step" ? `/api/simulations/${simulation.id}/step` : `/api/simulations/${simulation.id}/control`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: action === "step" ? undefined : JSON.stringify({ action }),
    });
    const payload = (await response.json()) as { simulation: SimulationRecord };
    setSimulation(payload.simulation);
    setStatus(action === "step" ? "Simulation advanced" : `Simulation ${action}`);
  }

  async function sendPps(observedPps: number, zone?: DecisionTargetZoneRecord) {
    if (!simulation) return;
    const targetZone = zone ?? selectedZone ?? firstActiveZone(activePackage, simulation.activeDecisionPointId);
    const response = await fetch(`/api/simulations/${simulation.id}/pps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        observedPps,
        targetZoneId: targetZone?.id,
        aimLon: targetZone?.centerLon,
        aimLat: targetZone?.centerLat,
      }),
    });
    const payload = (await response.json()) as { simulation: SimulationRecord };
    setSimulation(payload.simulation);
    if (targetZone) setSelectedZoneId(targetZone.id);
    setStatus(`${observedPps} PPS simulated`);
  }

  function selectWaypoint(waypointId: string) {
    setSelectedWaypointId(waypointId);
    setSelectedBranchWaypointId(null);
    setSelectedZoneId(null);
    setPlacementMode(null);
    setActiveBranchContext(null);
    setPendingZoneDecisionPointId(null);
    void recordUi("select", "waypoint", { waypointId });
  }

  function selectZone(zoneId: string) {
    setSelectedZoneId(zoneId);
    setSelectedWaypointId(null);
    setSelectedBranchWaypointId(null);
    setPlacementMode(null);
    setPendingZoneDecisionPointId(null);
    maybeArmBranchContext(activePackage, zoneId, activeBranchContext?.branchType ?? "primary");
    void recordUi("select", "decision_zone", { zoneId });
  }

  function selectBranchWaypoint(branchWaypointId: string) {
    const branchWaypoint = activePackage?.branchWaypoints.find((waypoint) => waypoint.id === branchWaypointId);
    if (!branchWaypoint) return;
    setSelectedBranchWaypointId(branchWaypointId);
    setSelectedWaypointId(null);
    setSelectedZoneId(branchWaypoint.decisionTargetZoneId);
    setPlacementMode(null);
    setPendingZoneDecisionPointId(null);
    setActiveBranchContext({
      decisionPointId: branchWaypoint.decisionPointId,
      zoneId: branchWaypoint.decisionTargetZoneId,
      branchType: branchWaypoint.branchType,
    });
    void recordUi("select", "branch_waypoint", { branchWaypointId });
  }

  function beginZonePlacement(decisionPointId: string) {
    setPendingZoneDecisionPointId(decisionPointId);
    setPlacementMode("decision_zone");
    setActiveBranchContext(null);
    setSelectedBranchWaypointId(null);
    setSelectedZoneId(null);
    const waypointId = activePackage?.decisionPoints.find((point) => point.id === decisionPointId)?.waypointId ?? null;
    if (waypointId) setSelectedWaypointId(waypointId);
    setStatus("Click the map to place a decision target zone");
    void recordUi("click", "zone_placement_begin", { decisionPointId });
  }

  function finishZonePlacement() {
    setPendingZoneDecisionPointId(null);
    setPlacementMode(null);
    setStatus("Target zone placement complete");
    void recordUi("click", "zone_placement_done", {});
  }

  function updatePackageState(pkg: LaunchPackageRecord) {
    setPackages((current) => current.map((item) => (item.id === pkg.id ? pkg : item)));
  }

  function maybeArmBranchContext(pkg: LaunchPackageRecord | null | undefined, zoneId: string, branchType: BranchType) {
    const decisionPoint = pkg?.decisionPoints.find((point) => point.targetZones.some((zone) => zone.id === zoneId));
    if (!decisionPoint || decisionPoint.targetZones.length < 2) {
      setActiveBranchContext(null);
      return;
    }
    setActiveBranchContext({ decisionPointId: decisionPoint.id, zoneId, branchType });
  }

  function chooseBranch(branchType: BranchType) {
    if (!selectedZoneDecisionPoint || !selectedZone) {
      setStatus("Select a decision target zone before choosing a branch lane");
      return;
    }
    if (selectedZoneDecisionPoint.targetZones.length < 2) {
      setStatus("Place at least 2 target zones before authoring branches");
      return;
    }
    setPlacementMode(null);
    setActiveBranchContext({ decisionPointId: selectedZoneDecisionPoint.id, zoneId: selectedZone.id, branchType });
    setStatus(`${branchButtons.find((branch) => branch.type === branchType)?.label ?? branchType} lane active. Click map to add branch waypoints.`);
    void recordUi("click", "branch_lane", { decisionPointId: selectedZoneDecisionPoint.id, zoneId: selectedZone.id, branchType });
  }

  async function recordUi(kind: string, target: string, payload: Record<string, unknown>) {
    await fetch("/api/debug/clickstream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, target, payload }),
    }).catch(() => undefined);
  }

  return (
    <main className="tactical-shell">
      <header className="mission-strip">
        <div className="mission-id">
          <span>{mission?.name ?? "Sunol Ridge Training Area"}</span>
          <strong>ISR Mission Planner</strong>
        </div>
        <div className="top-toolbar-actions">
          <button
            type="button"
            className="mode-toggle"
            onClick={() => {
              const nextMode = mode === "plan" ? "run" : "plan";
              setMode(nextMode);
              setPlacementMode(null);
              setActiveBranchContext(null);
              setPendingZoneDecisionPointId(null);
              void recordUi("click", "mode_toggle", { nextMode });
            }}
          >
            {mode === "plan" ? "Plan Mission" : "Run Simulation"}
          </button>
          <label className="asset-picker">
            <span>Assets</span>
            <select value={assetSource} onChange={(event) => setAssetSource(event.target.value as AssetSource)} aria-label="Asset source">
              <option value="palantir">Palantir</option>
              <option value="local">Local</option>
              <option value="auto">Auto</option>
            </select>
          </label>
        </div>
      </header>

      <TacticalCesiumMap
        mission={mission}
        layers={layers}
        activePackage={activePackage}
        placementMode={placementMode}
        mapMode={mapMode}
        selectedWaypointId={selectedWaypointId}
        selectedBranchWaypointId={selectedBranchWaypointId}
        selectedZoneId={selectedZoneId}
        activeBranchType={simulation?.activeBranchType ?? null}
        activeBranchContext={activeBranchContext}
        onMapPlacement={handleMapPlacement}
        onMapModeChange={setMapMode}
        onSelectWaypoint={selectWaypoint}
        onSelectBranchWaypoint={selectBranchWaypoint}
        onSelectZone={selectZone}
        onMoveWaypoint={handleMoveWaypoint}
        onMoveBranchWaypoint={handleMoveBranchWaypoint}
      />

      {placementMode === "decision_zone" && pendingZoneDecisionPoint ? (
        <PendingZonePrompt decisionPoint={pendingZoneDecisionPoint} onDone={finishZonePlacement} />
      ) : null}

      <aside className="planner-rail" aria-label="Launch package planner">
        <div className="rail-section packages-section">
          <div className="rail-heading">
            <span>Mission Plans</span>
            <button type="button" onClick={createPackage}>
              Add
            </button>
          </div>
          <div className="package-list">
            {packages.map((pkg) => (
              <div key={pkg.id} className={pkg.id === activePackage?.id ? "package-row package-row-active" : "package-row"}>
                {renamingPackageId === pkg.id ? (
                  <PackageRenameInput
                    currentName={pkg.name}
                    onSave={(name) => void handleRenamePackage(pkg.id, name)}
                    onCancel={() => setRenamingPackageId(null)}
                  />
                ) : (
                  <button
                    type="button"
                    className="package-row-button"
                    onClick={() => {
                      setExpandedPackageId(pkg.id);
                      setSelectedWaypointId(null);
                      setSelectedBranchWaypointId(null);
                      setSelectedZoneId(null);
                      setPendingZoneDecisionPointId(null);
                      setPlacementMode(null);
                      setActiveBranchContext(null);
                      void recordUi("click", "package_expand", { packageId: pkg.id });
                    }}
                    onDoubleClick={() => mode === "plan" && setRenamingPackageId(pkg.id)}
                  >
                    <span>{pkg.name}</span>
                    <small>
                      {pkg.waypoints.length} WP / {pkg.decisionPoints.flatMap((point) => point.targetZones).length} DTZ
                    </small>
                    {pkg.id === activePackage?.id && <em className="plan-selected-badge">Selected for launch</em>}
                  </button>
                )}
                {mode === "plan" && (
                  <button
                    type="button"
                    className="delete-button"
                    aria-label={`Delete ${pkg.name}`}
                    onClick={() => {
                      if (pkg.waypoints.length === 0) {
                        void handleDeletePackage(pkg.id);
                      } else {
                        setPendingDeletePkgId(pkg.id);
                      }
                    }}
                  >
                    x
                  </button>
                )}
              </div>
            ))}
            {packages.length === 0 && <div className="empty-state">No packages. Click Add to create one.</div>}
          </div>
          {pendingDeletePkgId && (
            <div className="confirm-delete" data-testid="confirm-delete">
              <span>This package has {packages.find((p) => p.id === pendingDeletePkgId)?.waypoints.length ?? 0} waypoints. Delete?</span>
              <button type="button" onClick={() => void handleDeletePackage(pendingDeletePkgId)}>
                Confirm delete
              </button>
              <button type="button" onClick={() => setPendingDeletePkgId(null)}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {activePackage ? (
          <div className="rail-section active-package" data-testid="active-package">
            <div className="rail-heading">
              <span>Selected Plan: {activePackage.name}</span>
              <button type="button" onClick={compilePackage}>
                Compile
              </button>
            </div>

            {mode === "plan" ? (
              <>
                <div className="placement-state">
                  <span>Placement</span>
                  <strong>
                    {placementMode === "decision_zone"
                      ? "Decision target zone"
                      : activeBranchContext && placementMode
                        ? `${behaviorByType[placementMode].label} on ${branchButtons.find((branch) => branch.type === activeBranchContext.branchType)?.label ?? activeBranchContext.branchType}`
                      : placementMode
                        ? behaviorByType[placementMode].label
                        : activeBranchContext
                          ? `${branchButtons.find((branch) => branch.type === activeBranchContext.branchType)?.label ?? activeBranchContext.branchType} branch`
                        : "Pick waypoint"}
                  </strong>
                  <small>
                    {placementMode === "decision_zone"
                      ? "Click the map to place target geometry."
                      : activeBranchContext
                        ? "Click the map to append to the selected DTZ branch from its decision point."
                      : "Pick a marker type, then click the map."}
                  </small>
                </div>
                <div className="palette-grid" aria-label="Waypoint palette">
                  {waypointBehaviors.map((behavior) => (
                    <button
                      key={behavior.type}
                      type="button"
                      aria-label={`Place ${behavior.label}`}
                      className={placementMode === behavior.type ? "palette-button palette-button-active" : "palette-button"}
                      style={{ "--marker-color": behavior.color } as CSSProperties}
                      onClick={() => {
                        setPlacementMode(behavior.type);
                        setSelectedBranchWaypointId(null);
                        setPendingZoneDecisionPointId(null);
                        void recordUi("click", "waypoint_palette", { behavior: behavior.type });
                      }}
                    >
                      <span>
                        <WaypointGlyph behavior={behavior} compact />
                      </span>
                      {behavior.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-label="Place target zone"
                    className={placementMode === "decision_zone" ? "palette-button zone-palette palette-button-active" : "palette-button zone-palette"}
                    onClick={() => {
                      const decisionPointId = selectedWaypointDecisionPoint?.id ?? activePackage.decisionPoints[0]?.id;
                      if (decisionPointId) {
                        beginZonePlacement(decisionPointId);
                      } else {
                        setStatus("Add a decision waypoint before placing a target zone");
                      }
                    }}
                  >
                    <span>DTZ</span>
                    Target Zone
                  </button>
                </div>
                <BranchAuthoringPanel
                  activePackage={activePackage}
                  selectedZone={selectedZone}
                  selectedDecisionPoint={selectedZoneDecisionPoint}
                  selectedBranchWaypointId={selectedBranchWaypointId}
                  activeBranchContext={activeBranchContext}
                  onChooseBranch={chooseBranch}
                  onSelectBranchWaypoint={selectBranchWaypoint}
                  onDeleteBranchWaypoint={handleDeleteBranchWaypoint}
                  onBeginZonePlacement={beginZonePlacement}
                />
                <WaypointList
                  activePackage={activePackage}
                  selectedWaypointId={selectedWaypointId}
                  onSelect={selectWaypoint}
                  onResequence={handleResequence}
                  mode={mode}
                />
              </>
            ) : (
              <SimulationPanel
                simulation={simulation}
                activePackage={activePackage}
                selectedZone={selectedZone}
                onStart={startSimulation}
                onAction={simulationAction}
                onPps={sendPps}
              />
            )}

            <EditableSelectionBlock
              activePackage={activePackage}
              waypoint={selectedWaypoint}
              branchWaypoint={selectedBranchWaypoint}
              zone={selectedZone}
              mode={mode}
              onSelectZone={selectZone}
              onBeginZonePlacement={beginZonePlacement}
              onUpdateWaypoint={handleUpdateWaypoint}
              onDeleteWaypoint={handleDeleteWaypoint}
              onUpdateBranchWaypoint={handleUpdateBranchWaypoint}
              onDeleteBranchWaypoint={handleDeleteBranchWaypoint}
              onUpdateZone={handleUpdateZone}
              onDeleteZone={handleDeleteZone}
            />
          </div>
        ) : null}
      </aside>

      <footer className="bottom-status">
        <span>{status}</span>
      </footer>
    </main>
  );
}

function PackageRenameInput({
  currentName,
  onSave,
  onCancel,
}: {
  currentName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  return (
    <input
      ref={inputRef}
      name="package-name"
      defaultValue={currentName}
      className="package-rename-input"
      onKeyDown={(e) => {
        if (e.key === "Enter") onSave(e.currentTarget.value);
        if (e.key === "Escape") onCancel();
      }}
      onBlur={(e) => onSave(e.currentTarget.value)}
    />
  );
}

function PendingZonePrompt({
  decisionPoint,
  onDone,
}: {
  decisionPoint: DecisionPointRecord;
  onDone: () => void;
}) {
  return (
    <div className="pending-zone-prompt" data-testid="pending-zone-prompt">
      <span aria-hidden="true" />
      <div>
        <strong>Place Decision Target Zone</strong>
        <p>
          Click the map to add PPS target geometry for {decisionPoint.name}. Each click drops another zone.
        </p>
      </div>
      <button type="button" onClick={onDone}>
        Done
      </button>
    </div>
  );
}

function WaypointList({
  activePackage,
  selectedWaypointId,
  onSelect,
  onResequence,
  mode,
}: {
  activePackage: LaunchPackageRecord;
  selectedWaypointId: string | null;
  onSelect: (waypointId: string) => void;
  onResequence: (waypointIds: string[]) => void;
  mode: Mode;
}) {
  function moveWaypoint(index: number, direction: "up" | "down") {
    const ids = activePackage.waypoints.map((wp) => wp.id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    onResequence(ids);
  }

  return (
    <ol className="waypoint-list" aria-label="Waypoint queue">
      {activePackage.waypoints.length === 0 && (
        <li className="empty-state">No waypoints placed yet.</li>
      )}
      {activePackage.waypoints.map((waypoint, index) => {
        const behavior = behaviorByType[waypoint.behavior];
        return (
          <li key={waypoint.id}>
            <button type="button" className={waypoint.id === selectedWaypointId ? "waypoint-row waypoint-row-active" : "waypoint-row"} onClick={() => onSelect(waypoint.id)}>
              <span className="queue-index">{waypoint.sequence}</span>
              <span className="waypoint-row-label">
                <strong>{waypoint.name}</strong>
                <small>{behavior.label}</small>
              </span>
            </button>
            {mode === "plan" && (
              <span className="waypoint-row-actions">
                {index > 0 && (
                  <button type="button" aria-label={`Move ${waypoint.name} up`} onClick={() => moveWaypoint(index, "up")}>
                    Up
                  </button>
                )}
                {index < activePackage.waypoints.length - 1 && (
                  <button type="button" aria-label={`Move ${waypoint.name} down`} onClick={() => moveWaypoint(index, "down")}>
                    Down
                  </button>
                )}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function BranchAuthoringPanel({
  activePackage,
  selectedZone,
  selectedDecisionPoint,
  selectedBranchWaypointId,
  activeBranchContext,
  onChooseBranch,
  onSelectBranchWaypoint,
  onDeleteBranchWaypoint,
  onBeginZonePlacement,
}: {
  activePackage: LaunchPackageRecord;
  selectedZone: DecisionTargetZoneRecord | null;
  selectedDecisionPoint: DecisionPointRecord | null;
  selectedBranchWaypointId: string | null;
  activeBranchContext: ActiveBranchContext;
  onChooseBranch: (branchType: BranchType) => void;
  onSelectBranchWaypoint: (branchWaypointId: string) => void;
  onDeleteBranchWaypoint: (branchWaypointId: string) => void;
  onBeginZonePlacement: (decisionPointId: string) => void;
}) {
  if (!selectedZone || !selectedDecisionPoint) {
    return <div className="branch-authoring branch-authoring-muted">Select a decision target zone to build Primary, Alternate, Hold, or Land lanes.</div>;
  }

  const zoneCount = selectedDecisionPoint.targetZones.length;
  const branchWaypoints = activePackage.branchWaypoints
    .filter((waypoint) => waypoint.decisionTargetZoneId === selectedZone.id)
    .sort((a, b) => a.branchType.localeCompare(b.branchType) || a.branchSequence - b.branchSequence);
  const ready = zoneCount >= 2 && zoneCount <= 4;

  return (
    <section className="branch-authoring" aria-label="Decision branch authoring">
      <div className="branch-authoring-header">
        <span>{selectedZone.name}</span>
        <strong>{selectedDecisionPoint.name}</strong>
        <small>{zoneCount}/4 zones placed</small>
      </div>
      {!ready ? (
        <div className="branch-authoring-warning">
          Place at least 2 target zones before branch lanes become active.
          <button type="button" onClick={() => onBeginZonePlacement(selectedDecisionPoint.id)}>
            Add Zone
          </button>
        </div>
      ) : null}
      <div className="branch-lane-grid">
        {branchButtons.map((branch) => (
          <button
            key={branch.type}
            type="button"
            aria-label={`Select ${branch.label} branch lane`}
            disabled={!ready}
            className={activeBranchContext?.zoneId === selectedZone.id && activeBranchContext.branchType === branch.type ? "branch-lane branch-lane-active" : "branch-lane"}
            onClick={() => onChooseBranch(branch.type)}
          >
            <span>{branch.shortLabel}</span>
            {branch.label}
          </button>
        ))}
      </div>
      <div className="branch-waypoint-list" aria-label="Branch waypoints">
        {branchWaypoints.length === 0 ? (
          <small>No branch waypoints for {selectedZone.name} yet.</small>
        ) : (
          branchButtons.map((branch) => {
            const laneWaypoints = branchWaypoints.filter((waypoint) => waypoint.branchType === branch.type);
            if (laneWaypoints.length === 0) return null;
            return (
              <div key={branch.type} className="branch-waypoint-lane">
                <strong>{branch.label}</strong>
                {laneWaypoints.map((waypoint) => (
                  <div key={waypoint.id} className={waypoint.id === selectedBranchWaypointId ? "branch-waypoint-row branch-waypoint-row-active" : "branch-waypoint-row"}>
                    <button type="button" onClick={() => onSelectBranchWaypoint(waypoint.id)}>
                      <span>{waypoint.branchSequence}</span>
                      {waypoint.name}
                    </button>
                    <button type="button" aria-label={`Delete ${waypoint.name}`} onClick={() => onDeleteBranchWaypoint(waypoint.id)}>
                      x
                    </button>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function EditableSelectionBlock({
  activePackage,
  waypoint,
  branchWaypoint,
  zone,
  mode,
  onSelectZone,
  onBeginZonePlacement,
  onUpdateWaypoint,
  onDeleteWaypoint,
  onUpdateBranchWaypoint,
  onDeleteBranchWaypoint,
  onUpdateZone,
  onDeleteZone,
}: {
  activePackage: LaunchPackageRecord;
  waypoint: WaypointRecord | null;
  branchWaypoint: BranchWaypointRecord | null;
  zone: DecisionTargetZoneRecord | null;
  mode: Mode;
  onSelectZone: (zoneId: string) => void;
  onBeginZonePlacement: (decisionPointId: string) => void;
  onUpdateWaypoint: (waypointId: string, fields: Partial<WaypointRecord>) => void;
  onDeleteWaypoint: (waypointId: string) => void;
  onUpdateBranchWaypoint: (branchWaypointId: string, fields: Partial<BranchWaypointRecord>) => void;
  onDeleteBranchWaypoint: (branchWaypointId: string) => void;
  onUpdateZone: (zoneId: string, fields: Partial<DecisionTargetZoneRecord>) => void;
  onDeleteZone: (zoneId: string) => void;
}) {
  if (!waypoint && !branchWaypoint && !zone) return <div className="selection-inline">Select a waypoint or target zone.</div>;

  if (branchWaypoint) {
    if (mode === "plan") {
      return (
        <BranchWaypointEditForm
          waypoint={branchWaypoint}
          onSave={(fields) => onUpdateBranchWaypoint(branchWaypoint.id, fields)}
          onDelete={() => onDeleteBranchWaypoint(branchWaypoint.id)}
        />
      );
    }
    return (
      <div className="selection-inline">
        <strong>
          {branchButtons.find((branch) => branch.type === branchWaypoint.branchType)?.label ?? branchWaypoint.branchType}: {branchWaypoint.name}
        </strong>
        <span>{formatLatLon(branchWaypoint.lon, branchWaypoint.lat)}</span>
        <span>{formatMgrs(branchWaypoint.lon, branchWaypoint.lat)}</span>
      </div>
    );
  }

  if (zone) {
    if (mode === "plan") {
      return (
        <ZoneEditForm
          zone={zone}
          onSave={(fields) => onUpdateZone(zone.id, fields)}
          onDelete={() => onDeleteZone(zone.id)}
        />
      );
    }
    return (
      <div className="selection-inline">
        <strong>{zone.name}</strong>
        <span>{formatLatLon(zone.centerLon, zone.centerLat)}</span>
        <span>{formatMgrs(zone.centerLon, zone.centerLat)}</span>
        <span>{Math.round(zone.radiusM)} m radius</span>
      </div>
    );
  }

  if (!waypoint) return null;

  if (mode === "plan") {
    const decisionPoint = waypoint.behavior === "decision" ? activePackage.decisionPoints.find((point) => point.waypointId === waypoint.id) ?? null : null;
    return (
      <div className="selected-waypoint-panel">
        {decisionPoint ? (
          <DecisionTargetZoneSummary
            decisionPoint={decisionPoint}
            onSelectZone={onSelectZone}
            onBeginZonePlacement={() => onBeginZonePlacement(decisionPoint.id)}
            onDeleteZone={onDeleteZone}
          />
        ) : null}
        <WaypointEditForm
          waypoint={waypoint}
          onSave={(fields) => onUpdateWaypoint(waypoint.id, fields)}
          onDelete={() => onDeleteWaypoint(waypoint.id)}
        />
      </div>
    );
  }

  return (
    <div className="selection-inline">
      <strong>
        {waypoint.sequence}. {waypoint.name}
      </strong>
      <span>{formatLatLon(waypoint.lon, waypoint.lat)}</span>
      <span>{formatMgrs(waypoint.lon, waypoint.lat)}</span>
    </div>
  );
}

function DecisionTargetZoneSummary({
  decisionPoint,
  onSelectZone,
  onBeginZonePlacement,
  onDeleteZone,
}: {
  decisionPoint: DecisionPointRecord;
  onSelectZone: (zoneId: string) => void;
  onBeginZonePlacement: () => void;
  onDeleteZone: (zoneId: string) => void;
}) {
  const canAddZones = decisionPoint.targetZones.length < 4;
  return (
    <div className="decision-zone-summary" aria-label="Decision target zones">
      <p className="eyebrow">Decision Target Zones</p>
      <span>Place 2-4 zones before authoring branch lanes.</span>
      {decisionPoint.targetZones.length > 0 ? (
        <ul>
          {decisionPoint.targetZones.map((zone) => (
            <li key={zone.id}>
              <button type="button" className="zone-list-button" onClick={() => onSelectZone(zone.id)}>
                <strong>{zone.name}</strong>
              </button>
              <small>{formatMgrs(zone.centerLon, zone.centerLat)}</small>
              <button type="button" aria-label={`Delete ${zone.name}`} onClick={() => onDeleteZone(zone.id)}>
                x
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <small>No zones placed for this decision.</small>
      )}
      {canAddZones ? (
        <button type="button" className="primary-action" onClick={onBeginZonePlacement}>
          Add Target Zone On Map
        </button>
      ) : (
        <small>Maximum 4 zones for this decision.</small>
      )}
    </div>
  );
}

function WaypointEditForm({
  waypoint,
  onSave,
  onDelete,
}: {
  waypoint: WaypointRecord;
  onSave: (fields: Partial<WaypointRecord>) => void;
  onDelete: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    onSave({
      name: data.get("waypoint-name") as string,
      behavior: data.get("behavior") as WaypointBehavior,
      objective: data.get("objective") as string,
      altitudeM: Number(data.get("altitude")) || null,
      dwellSeconds: Number(data.get("dwell")) || null,
      lat: Number(data.get("latitude")),
      lon: Number(data.get("longitude")),
    });
  }

  return (
    <form ref={formRef} className="edit-form" onSubmit={handleSubmit} data-testid="waypoint-edit-form">
      <label>
        Name
        <input name="waypoint-name" defaultValue={waypoint.name} key={waypoint.id} />
      </label>
      <label>
        Behavior
        <select name="behavior" defaultValue={waypoint.behavior} key={`beh-${waypoint.id}`}>
          {waypointBehaviors.map((b) => (
            <option key={b.type} value={b.type}>{b.label}</option>
          ))}
        </select>
      </label>
      <label>
        Objective
        <input name="objective" defaultValue={waypoint.objective} key={`obj-${waypoint.id}`} />
      </label>
      <label>
        Altitude (m)
        <input name="altitude" type="number" defaultValue={waypoint.altitudeM ?? ""} key={`alt-${waypoint.id}`} />
      </label>
      <label>
        Dwell (s)
        <input name="dwell" type="number" defaultValue={waypoint.dwellSeconds ?? ""} key={`dw-${waypoint.id}`} />
      </label>
      <label>
        Latitude
        <input name="latitude" type="number" step="any" defaultValue={waypoint.lat} key={`lat-${waypoint.id}`} />
      </label>
      <label>
        Longitude
        <input name="longitude" type="number" step="any" defaultValue={waypoint.lon} key={`lon-${waypoint.id}`} />
      </label>
      <div className="edit-actions">
        <button type="submit">Save</button>
        <button type="button" aria-label="Delete waypoint" onClick={onDelete}>
          Delete
        </button>
      </div>
    </form>
  );
}

function BranchWaypointEditForm({
  waypoint,
  onSave,
  onDelete,
}: {
  waypoint: BranchWaypointRecord;
  onSave: (fields: Partial<BranchWaypointRecord>) => void;
  onDelete: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    onSave({
      name: data.get("branch-waypoint-name") as string,
      behavior: data.get("behavior") as WaypointBehavior,
      objective: data.get("objective") as string,
      altitudeM: Number(data.get("altitude")) || null,
      dwellSeconds: Number(data.get("dwell")) || null,
      lat: Number(data.get("latitude")),
      lon: Number(data.get("longitude")),
    });
  }

  return (
    <form ref={formRef} className="edit-form" onSubmit={handleSubmit} data-testid="branch-waypoint-edit-form">
      <strong>{branchButtons.find((branch) => branch.type === waypoint.branchType)?.label ?? waypoint.branchType} Branch Waypoint</strong>
      <label>
        Name
        <input name="branch-waypoint-name" defaultValue={waypoint.name} key={waypoint.id} />
      </label>
      <label>
        Behavior
        <select name="behavior" defaultValue={waypoint.behavior} key={`branch-beh-${waypoint.id}`}>
          {waypointBehaviors.map((b) => (
            <option key={b.type} value={b.type}>{b.label}</option>
          ))}
        </select>
      </label>
      <label>
        Objective
        <input name="objective" defaultValue={waypoint.objective} key={`branch-obj-${waypoint.id}`} />
      </label>
      <label>
        Altitude AGL (m)
        <input name="altitude" type="number" defaultValue={waypoint.altitudeM ?? ""} key={`branch-alt-${waypoint.id}`} />
      </label>
      <label>
        Dwell (s)
        <input name="dwell" type="number" defaultValue={waypoint.dwellSeconds ?? ""} key={`branch-dw-${waypoint.id}`} />
      </label>
      <label>
        Latitude
        <input name="latitude" type="number" step="any" defaultValue={waypoint.lat} key={`branch-lat-${waypoint.id}`} />
      </label>
      <label>
        Longitude
        <input name="longitude" type="number" step="any" defaultValue={waypoint.lon} key={`branch-lon-${waypoint.id}`} />
      </label>
      <div className="edit-actions">
        <button type="submit">Save</button>
        <button type="button" aria-label="Delete branch waypoint" onClick={onDelete}>
          Delete
        </button>
      </div>
    </form>
  );
}

function ZoneEditForm({
  zone,
  onSave,
  onDelete,
}: {
  zone: DecisionTargetZoneRecord;
  onSave: (fields: Partial<DecisionTargetZoneRecord>) => void;
  onDelete: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const allowedPps = [1, 2, 4, 8].filter((v) => data.get(`pps-${v}`) === "on");
    onSave({
      radiusM: Number(data.get("zone-radius")) || 250,
      centerLat: Number(data.get("zone-center-lat")),
      centerLon: Number(data.get("zone-center-lon")),
      allowedPps,
    });
  }

  return (
    <form ref={formRef} className="edit-form" onSubmit={handleSubmit} data-testid="zone-edit-form">
      <strong>{zone.name}</strong>
      <label>
        Radius (m)
        <input name="zone-radius" type="number" defaultValue={zone.radiusM} key={zone.id} />
      </label>
      <label>
        Center Lat
        <input name="zone-center-lat" type="number" step="any" defaultValue={zone.centerLat} key={`lat-${zone.id}`} />
      </label>
      <label>
        Center Lon
        <input name="zone-center-lon" type="number" step="any" defaultValue={zone.centerLon} key={`lon-${zone.id}`} />
      </label>
      <fieldset>
        <legend>Allowed PPS</legend>
        {[1, 2, 4, 8].map((v) => (
          <label key={v}>
            <input name={`pps-${v}`} type="checkbox" defaultChecked={zone.allowedPps.includes(v)} />
            {v} PPS
          </label>
        ))}
      </fieldset>
      <div className="edit-actions">
        <button type="submit">Save</button>
        <button type="button" aria-label="Delete zone" onClick={onDelete}>
          Delete
        </button>
      </div>
    </form>
  );
}

function SimulationPanel({
  simulation,
  activePackage,
  selectedZone,
  onStart,
  onAction,
  onPps,
}: {
  simulation: SimulationRecord | null;
  activePackage: LaunchPackageRecord;
  selectedZone: DecisionTargetZoneRecord | null;
  onStart: () => void;
  onAction: (action: "pause" | "resume" | "reset" | "step") => void;
  onPps: (observedPps: number, zone?: DecisionTargetZoneRecord) => void;
}) {
  const activeZone = selectedZone ?? firstActiveZone(activePackage, simulation?.activeDecisionPointId ?? null);
  return (
    <section className="simulation-panel" aria-label="Launch Package Simulation">
      {!simulation ? (
        <button type="button" className="primary-action" aria-label="Launch selected plan" onClick={onStart}>
          Launch Selected Plan
        </button>
      ) : (
        <>
          <div className="sim-readout">
            <span>{simulation.status.toUpperCase()}</span>
            <strong>WP {simulation.currentWaypointSeq}</strong>
            <small>{simulation.clockSeconds}s</small>
          </div>
          <div className="sim-controls">
            <button type="button" onClick={() => onAction("step")}>
              Step
            </button>
            <button type="button" onClick={() => onAction("resume")}>
              Play
            </button>
            <button type="button" onClick={() => onAction("pause")}>
              Pause
            </button>
            <button type="button" onClick={() => onAction("reset")}>
              Reset
            </button>
          </div>
          <div className="pps-grid" aria-label="PPS controls">
            {[
              [1, "Hold"],
              [2, "Land"],
              [4, "Primary"],
              [8, "Alternate"],
            ].map(([pps, label]) => (
              <button key={pps} type="button" onClick={() => onPps(Number(pps), activeZone ?? undefined)}>
                {pps} PPS
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="audit-log" aria-label="Audit log">
            {simulation.auditLog.slice(-5).map((event) => (
              <p key={event.id}>{event.message}</p>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function firstActiveZone(pkg: LaunchPackageRecord | null, activeDecisionPointId: string | null): DecisionTargetZoneRecord | null {
  if (!pkg) return null;
  const zones = pkg.decisionPoints.flatMap((point) => point.targetZones);
  return zones.find((zone) => zone.decisionPointId === activeDecisionPointId) ?? zones[0] ?? null;
}

function newestBranchWaypoint(pkg: LaunchPackageRecord, context: NonNullable<ActiveBranchContext>): BranchWaypointRecord | null {
  return (
    pkg.branchWaypoints
      .filter((waypoint) => waypoint.decisionTargetZoneId === context.zoneId && waypoint.branchType === context.branchType)
      .sort((a, b) => b.branchSequence - a.branchSequence)[0] ?? null
  );
}

function isTextEntryTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}
