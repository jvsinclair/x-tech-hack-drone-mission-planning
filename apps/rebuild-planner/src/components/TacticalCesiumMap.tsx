"use client";

/*
Module Context
Purpose:
- Render the tactical mission map and map placement/selection interactions for the rebuild planner.
Why This Exists:
- The PRD requires Cesium Direct while tests still need deterministic click behavior without a browser globe.
Primary Inputs/Outputs:
- Inputs: Mission layers, active package, placement mode, and selected waypoint/zone IDs.
- Outputs: Map click placement callbacks and selected waypoint callbacks.
Research / Source Links:
- docs/PALANTIR_REBUILD_MASTER_PRD.md
Validated:
- provisional: HTML overlay is component-tested; Cesium path is browser-verified during local demo.
Current Limits / TODO:
- Cesium 3D is the primary browser path; HTML/SVG rendering remains as the deterministic test fallback.
Agent Maintenance Rule:
- Do not add hardware-control integrations here; all interactions remain planning/simulation UI events.
*/

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MutableRefObject } from "react";
import type { BranchType, BranchWaypointRecord, DecisionTargetZoneRecord, LaunchPackageRecord, MissionLayers, MissionSummary, WaypointRecord } from "@/lib/types";
import { behaviorByType } from "@/lib/symbology/isr";
import { WaypointGlyph } from "@/components/WaypointGlyph";

type PlacementMode = "decision_zone" | WaypointRecord["behavior"] | null;
type MapMode = "terrain3d" | "topo2d";
type TerrainSample = { lon: number; lat: number; elevationM: number };
type ActiveBranchContext = { decisionPointId: string; zoneId: string; branchType: BranchType } | null;
const DEFAULT_ALTITUDE_M = 20;

type TacticalCesiumMapProps = {
  mission: MissionSummary | null;
  layers: MissionLayers | null;
  activePackage: LaunchPackageRecord | null;
  placementMode: PlacementMode;
  mapMode: MapMode;
  selectedWaypointId: string | null;
  selectedBranchWaypointId: string | null;
  selectedZoneId: string | null;
  activeBranchType: string | null;
  activeBranchContext: ActiveBranchContext;
  onMapPlacement: (lon: number, lat: number) => void;
  onMapModeChange: (mode: MapMode) => void;
  onSelectWaypoint: (waypointId: string) => void;
  onSelectBranchWaypoint: (branchWaypointId: string) => void;
  onSelectZone: (zoneId: string) => void;
  onMoveWaypoint: (waypointId: string, lon: number, lat: number) => void;
  onMoveBranchWaypoint: (branchWaypointId: string, lon: number, lat: number) => void;
};

export function TacticalCesiumMap({
  mission,
  layers,
  activePackage,
  placementMode,
  mapMode,
  selectedWaypointId,
  selectedBranchWaypointId,
  selectedZoneId,
  activeBranchType,
  activeBranchContext,
  onMapPlacement,
  onMapModeChange,
  onSelectWaypoint,
  onSelectBranchWaypoint,
  onSelectZone,
  onMoveWaypoint,
  onMoveBranchWaypoint,
}: TacticalCesiumMapProps) {
  const mapStageRef = useRef<HTMLElement | null>(null);
  const cesiumContainerRef = useRef<HTMLDivElement | null>(null);
  const cesiumRef = useRef<any | null>(null);
  const viewerRef = useRef<any | null>(null);
  const missionDataSourcesRef = useRef<any[]>([]);
  const packageDataSourceRef = useRef<any | null>(null);
  const cesiumDragRef = useRef<{ kind: "waypoint" | "branch-waypoint"; waypointId: string; altitudeM: number | null; draft: { lon: number; lat: number } | null } | null>(null);
  const mapDragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const waypointDragRef = useRef<{ kind: "waypoint" | "branch-waypoint"; waypointId: string; altitudeM: number | null } | null>(null);
  const waypointDraftRef = useRef<{ kind: "waypoint" | "branch-waypoint"; waypointId: string; lon: number; lat: number } | null>(null);
  const windowDragCleanupRef = useRef<(() => void) | null>(null);
  const placementModeRef = useRef<PlacementMode>(placementMode);
  const activeBranchContextRef = useRef<ActiveBranchContext>(activeBranchContext);
  const onMapPlacementRef = useRef(onMapPlacement);
  const onMoveWaypointRef = useRef(onMoveWaypoint);
  const onMoveBranchWaypointRef = useRef(onMoveBranchWaypoint);
  const [mapPanOffset, setMapPanOffset] = useState({ x: 0, y: 0 });
  const [draggedWaypoint, setDraggedWaypoint] = useState<{ waypointId: string; lon: number; lat: number } | null>(null);
  const [draggedBranchWaypoint, setDraggedBranchWaypoint] = useState<{ waypointId: string; lon: number; lat: number } | null>(null);
  const [cesiumReady, setCesiumReady] = useState(false);
  const [cesiumRevision, setCesiumRevision] = useState(0);
  const bounds = mission?.bounds ?? { west: -121.9, south: 37.48, east: -121.74, north: 37.6 };
  const terrainSamples = useMemo(() => terrainSamplesFromLayer(layers?.terrain ?? null), [layers?.terrain]);
  const displayWaypoints = useMemo(() => {
    const waypoints = activePackage?.waypoints ?? [];
    if (!draggedWaypoint) return waypoints;
    return waypoints.map((waypoint) =>
      waypoint.id === draggedWaypoint.waypointId ? { ...waypoint, lon: draggedWaypoint.lon, lat: draggedWaypoint.lat } : waypoint,
    );
  }, [activePackage?.waypoints, draggedWaypoint]);
  const routeGeometry = useMemo(() => makeRouteGeometry(displayWaypoints, bounds, terrainSamples), [displayWaypoints, bounds, terrainSamples]);
  const displayBranchWaypoints = useMemo(() => {
    const waypoints = activePackage?.branchWaypoints ?? [];
    if (!draggedBranchWaypoint) return waypoints;
    return waypoints.map((waypoint) =>
      waypoint.id === draggedBranchWaypoint.waypointId ? { ...waypoint, lon: draggedBranchWaypoint.lon, lat: draggedBranchWaypoint.lat } : waypoint,
    );
  }, [activePackage?.branchWaypoints, draggedBranchWaypoint]);
  const branchPaths = useMemo(() => branchSvgPaths(activePackage, displayBranchWaypoints, bounds, terrainSamples), [activePackage, bounds, displayBranchWaypoints, terrainSamples]);
  const mapPanStyle = useMemo(() => ({ transform: `translate3d(${mapPanOffset.x}px, ${mapPanOffset.y}px, 0)` }), [mapPanOffset.x, mapPanOffset.y]);

  useEffect(() => {
    placementModeRef.current = placementMode;
    activeBranchContextRef.current = activeBranchContext;
    onMapPlacementRef.current = onMapPlacement;
    onMoveWaypointRef.current = onMoveWaypoint;
    onMoveBranchWaypointRef.current = onMoveBranchWaypoint;
  }, [activeBranchContext, onMapPlacement, onMoveBranchWaypoint, onMoveWaypoint, placementMode]);

  useEffect(() => {
    return () => clearWindowDragListeners();
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "test" || !cesiumContainerRef.current || !mission || !layers) return;
    let destroyed = false;
    let cleanup = () => {};
    window.CESIUM_BASE_URL = "/cesium";

    import("cesium")
      .then(async (Cesium) => {
        if (destroyed || !cesiumContainerRef.current) return;
        const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN ?? "";
        Cesium.Ion.defaultAccessToken = ionToken;
        const viewer = new Cesium.Viewer(cesiumContainerRef.current, {
          animation: false,
          timeline: false,
          fullscreenButton: false,
          homeButton: false,
          geocoder: false,
          baseLayerPicker: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          infoBox: false,
          selectionIndicator: false,
          shouldAnimate: false,
          sceneMode: Cesium.SceneMode.SCENE3D,
          ...(ionToken
            ? { terrain: Cesium.Terrain.fromWorldTerrain({ requestVertexNormals: true }) }
            : { terrainProvider: new Cesium.EllipsoidTerrainProvider() }),
          requestRenderMode: true,
          maximumRenderTimeChange: Number.POSITIVE_INFINITY,
        });
        cesiumRef.current = Cesium;
        viewerRef.current = viewer;
        viewer.scene.globe.depthTestAgainstTerrain = false;
        applyCesiumMapMode(viewer, Cesium, bounds, "terrain3d");
        missionDataSourcesRef.current = await addMissionGeoJsonLayers(viewer, Cesium, layers);

        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((movement: { position: unknown }) => {
          const picked = viewer.scene.pick(movement.position as never);
          const entity = picked?.id;
          const kind = getEntityProperty(entity, "plannerKind");
          if (kind === "waypoint") {
            const waypointId = getEntityProperty(entity, "waypointId");
            if (typeof waypointId === "string") onSelectWaypoint(waypointId);
            return;
          }
          if (kind === "branch-waypoint") {
            const waypointId = getEntityProperty(entity, "branchWaypointId");
            if (typeof waypointId === "string") onSelectBranchWaypoint(waypointId);
            return;
          }
          if (kind === "decision-zone") {
            const zoneId = getEntityProperty(entity, "zoneId");
            if (typeof zoneId === "string") onSelectZone(zoneId);
            return;
          }
          if (!placementModeRef.current && !activeBranchContextRef.current) return;
          const point = pickGlobeLonLat(viewer, Cesium, movement.position);
          if (!point) return;
          onMapPlacementRef.current(point.lon, point.lat);
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        handler.setInputAction((movement: { position: unknown }) => {
          if (placementModeRef.current) return;
          const picked = viewer.scene.pick(movement.position as never);
          const entity = picked?.id;
          const plannerKind = getEntityProperty(entity, "plannerKind");
          if (plannerKind !== "waypoint" && plannerKind !== "branch-waypoint") return;
          const waypointId = plannerKind === "branch-waypoint" ? getEntityProperty(entity, "branchWaypointId") : getEntityProperty(entity, "waypointId");
          if (typeof waypointId !== "string") return;
          const altitudeM = Number(getEntityProperty(entity, "altitudeM") ?? DEFAULT_ALTITUDE_M);
          cesiumDragRef.current = { kind: plannerKind, waypointId, altitudeM, draft: null };
          if (plannerKind === "branch-waypoint") onSelectBranchWaypoint(waypointId);
          else onSelectWaypoint(waypointId);
          viewer.scene.screenSpaceCameraController.enableInputs = false;
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

        handler.setInputAction((movement: { endPosition: unknown }) => {
          if (!cesiumDragRef.current) return;
          const point = pickGlobeLonLat(viewer, Cesium, movement.endPosition);
          if (!point) return;
          const { lon, lat } = point;
          cesiumDragRef.current.draft = { lon, lat };
          if (cesiumDragRef.current.kind === "branch-waypoint") {
            setDraggedBranchWaypoint({ waypointId: cesiumDragRef.current.waypointId, lon, lat });
          } else {
            setDraggedWaypoint({ waypointId: cesiumDragRef.current.waypointId, lon, lat });
          }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        handler.setInputAction(() => {
          if (cesiumDragRef.current?.draft) {
            if (cesiumDragRef.current.kind === "branch-waypoint") {
              onMoveBranchWaypointRef.current(cesiumDragRef.current.waypointId, cesiumDragRef.current.draft.lon, cesiumDragRef.current.draft.lat);
            } else {
              onMoveWaypointRef.current(cesiumDragRef.current.waypointId, cesiumDragRef.current.draft.lon, cesiumDragRef.current.draft.lat);
            }
          }
          cesiumDragRef.current = null;
          setDraggedWaypoint(null);
          setDraggedBranchWaypoint(null);
          viewer.scene.screenSpaceCameraController.enableInputs = true;
        }, Cesium.ScreenSpaceEventType.LEFT_UP);

        cleanup = () => {
          handler.destroy();
          removePackageDataSource(viewer);
          removeMissionDataSources(viewer, missionDataSourcesRef.current);
          viewer.destroy();
          viewerRef.current = null;
          cesiumRef.current = null;
          packageDataSourceRef.current = null;
          missionDataSourcesRef.current = [];
          setCesiumReady(false);
        };
        setCesiumReady(true);
        setCesiumRevision((revision) => revision + 1);
      })
      .catch(() => {
        cleanup = () => {};
      });

    return () => {
      destroyed = true;
      cleanup();
    };
  }, [bounds, layers, mission]);

  useEffect(() => {
    if (!cesiumReady || !viewerRef.current || !cesiumRef.current) return;
    applyCesiumMapMode(viewerRef.current, cesiumRef.current, bounds, mapMode);
  }, [bounds, cesiumReady, mapMode]);

  useEffect(() => {
    if (!cesiumReady || !viewerRef.current || !cesiumRef.current || !mission || !layers) return;
    drawCesiumPackageGraphics({
      Cesium: cesiumRef.current,
      activeBranchType,
      activePackage,
      bounds,
      displayBranchWaypoints,
      displayWaypoints,
      selectedBranchWaypointId,
      selectedWaypointId,
      selectedZoneId,
      terrainSamples,
      viewer: viewerRef.current,
      packageDataSourceRef,
    });
  }, [activeBranchType, activePackage, bounds, cesiumReady, cesiumRevision, displayBranchWaypoints, displayWaypoints, layers, mission, selectedBranchWaypointId, selectedWaypointId, selectedZoneId, terrainSamples]);

  function handleMapClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!placementMode && !activeBranchContext) return;
    const point = eventToLonLat(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY, bounds, mapPanOffset, 0);
    onMapPlacement(point.lon, point.lat);
  }

  function handleMapMouseDown(event: React.MouseEvent<HTMLElement>) {
    if (placementMode || activeBranchContext || event.button !== 0 || isInteractiveTarget(event.target)) return;
    mapDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: mapPanOffset.x,
      originY: mapPanOffset.y,
    };
    attachWindowDragListeners();
  }

  function handleMapMouseMove(event: React.MouseEvent<HTMLElement>) {
    updateDragFromClient(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY);
  }

  function updateDragFromClient(rect: DOMRect, clientX: number, clientY: number) {
    if (waypointDragRef.current) {
      const point = clientToGroundLonLatFromFlight(rect, clientX, clientY, bounds, mapPanOffset, waypointDragRef.current.altitudeM, terrainSamples);
      const draft = { kind: waypointDragRef.current.kind, waypointId: waypointDragRef.current.waypointId, lon: point.lon, lat: point.lat };
      waypointDraftRef.current = draft;
      if (draft.kind === "branch-waypoint") setDraggedBranchWaypoint(draft);
      else setDraggedWaypoint(draft);
      return;
    }

    if (!mapDragRef.current) return;
    setMapPanOffset({
      x: mapDragRef.current.originX + clientX - mapDragRef.current.startX,
      y: mapDragRef.current.originY + clientY - mapDragRef.current.startY,
    });
  }

  function handleMapMouseUp() {
    if (waypointDragRef.current && waypointDraftRef.current) {
      const draft = waypointDraftRef.current;
      if (draft.kind === "branch-waypoint") onMoveBranchWaypointRef.current(draft.waypointId, draft.lon, draft.lat);
      else onMoveWaypointRef.current(draft.waypointId, draft.lon, draft.lat);
    }
    mapDragRef.current = null;
    waypointDragRef.current = null;
    waypointDraftRef.current = null;
    setDraggedWaypoint(null);
    setDraggedBranchWaypoint(null);
    clearWindowDragListeners();
  }

  function attachWindowDragListeners() {
    if (typeof window === "undefined") return;
    clearWindowDragListeners();
    const handleWindowMouseMove = (event: MouseEvent) => {
      const rect = mapStageRef.current?.getBoundingClientRect();
      if (!rect) return;
      updateDragFromClient(rect, event.clientX, event.clientY);
    };
    const handleWindowMouseUp = () => handleMapMouseUp();
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    windowDragCleanupRef.current = () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      windowDragCleanupRef.current = null;
    };
  }

  function clearWindowDragListeners() {
    windowDragCleanupRef.current?.();
  }

  return (
    <section
      ref={mapStageRef}
      className={cesiumReady ? "map-stage map-stage-cesium-active" : "map-stage"}
      aria-label="Mission map"
      data-testid="mission-map-stage"
      onMouseDown={handleMapMouseDown}
      onMouseMove={handleMapMouseMove}
      onMouseUp={handleMapMouseUp}
      onMouseLeave={handleMapMouseUp}
    >
      <div ref={cesiumContainerRef} className="cesium-root" data-testid="cesium-root" />
      <div className="map-mode-controls" aria-label="Map view controls">
        <button type="button" className={mapMode === "terrain3d" ? "is-active" : ""} aria-pressed={mapMode === "terrain3d"} onClick={() => onMapModeChange("terrain3d")}>
          3D
        </button>
        <button type="button" className={mapMode === "topo2d" ? "is-active" : ""} aria-pressed={mapMode === "topo2d"} onClick={() => onMapModeChange("topo2d")}>
          2D
        </button>
      </div>
      <div className="map-grid" aria-hidden="true" />
      <svg className="map-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" style={mapPanStyle} data-testid="route-overlay">
        <path d={routeGeometry.groundPath} className="drone-ground-path" data-testid="ground-route-path" />
        {routeGeometry.tethers.map((tether) => (
          <line key={tether.id} x1={tether.ground.x} y1={tether.ground.y} x2={tether.flight.x} y2={tether.flight.y} className="drone-altitude-tether" />
        ))}
        <path d={routeGeometry.flightPath} className="drone-route-path" data-testid="flight-route-path" />
        {branchPaths.map((branch) => (
          <path key={branch.id} d={branch.path} className={branch.type === activeBranchType ? "branch-path branch-path-active" : "branch-path"} />
        ))}
      </svg>
      <div className={placementMode || activeBranchContext ? "map-click-capture map-click-capture-active" : "map-click-capture"} data-testid="map-click-surface" onClick={handleMapClick}>
        {placementMode || activeBranchContext ? (
          <span>
            {placementMode === "decision_zone"
              ? "Click map to place target zone"
              : placementMode
                ? "Click map to place waypoint"
                : `Click map to add ${activeBranchContext?.branchType ?? ""} branch waypoint`}
          </span>
        ) : null}
      </div>
      <div className="map-marker-layer" style={mapPanStyle} data-testid="map-marker-layer">
        {(activePackage?.decisionPoints ?? []).flatMap((point) =>
          point.targetZones.map((zone) => (
            <button
              key={zone.id}
              type="button"
              className={zone.id === selectedZoneId ? "decision-zone decision-zone-selected" : "decision-zone"}
              style={zoneStyle(zone, bounds)}
              onClick={(event) => {
                event.stopPropagation();
                onSelectZone(zone.id);
              }}
              data-testid={`decision-zone-${zone.id}`}
              aria-label={`Select ${zone.name}`}
            >
              <span>{zone.name}</span>
            </button>
          )),
        )}
        {displayWaypoints.map((waypoint) => {
          const behavior = behaviorByType[waypoint.behavior];
          return (
            <button
              key={waypoint.id}
              type="button"
              className={waypoint.id === selectedWaypointId ? "waypoint-marker waypoint-marker-selected" : "waypoint-marker"}
              style={{ ...flightPointStyle(waypoint, bounds, terrainSamples), "--marker-color": behavior.color } as CSSProperties}
              onMouseDown={(event) => {
                if (event.button !== 0 || placementMode) return;
                event.preventDefault();
                event.stopPropagation();
                onSelectWaypoint(waypoint.id);
                waypointDragRef.current = { kind: "waypoint", waypointId: waypoint.id, altitudeM: waypoint.altitudeM };
                waypointDraftRef.current = { kind: "waypoint", waypointId: waypoint.id, lon: waypoint.lon, lat: waypoint.lat };
              }}
              onClick={(event) => {
                event.stopPropagation();
                onSelectWaypoint(waypoint.id);
              }}
              data-testid={`map-waypoint-${waypoint.id}`}
              aria-label={`Select ${waypoint.name}`}
            >
              <span className="waypoint-glyph">
                <WaypointGlyph behavior={behavior} />
              </span>
              <span className="waypoint-seq">{waypoint.sequence}</span>
            </button>
          );
        })}
        {displayBranchWaypoints.map((waypoint) => {
          return (
            <button
              key={waypoint.id}
              type="button"
              className={waypoint.id === selectedBranchWaypointId ? `branch-waypoint-marker branch-waypoint-marker-${waypoint.branchType} branch-waypoint-marker-selected` : `branch-waypoint-marker branch-waypoint-marker-${waypoint.branchType}`}
              style={{ ...flightPointStyle(waypoint, bounds, terrainSamples), "--marker-color": branchColor(waypoint.branchType) } as CSSProperties}
              onMouseDown={(event) => {
                if (event.button !== 0 || placementMode) return;
                event.preventDefault();
                event.stopPropagation();
                onSelectBranchWaypoint(waypoint.id);
                waypointDragRef.current = { kind: "branch-waypoint", waypointId: waypoint.id, altitudeM: waypoint.altitudeM };
                waypointDraftRef.current = { kind: "branch-waypoint", waypointId: waypoint.id, lon: waypoint.lon, lat: waypoint.lat };
              }}
              onClick={(event) => {
                event.stopPropagation();
                onSelectBranchWaypoint(waypoint.id);
              }}
              data-testid={`map-branch-waypoint-${waypoint.id}`}
              aria-label={`Select ${waypoint.name}`}
            >
              <span className="branch-waypoint-dot">{waypoint.branchSequence}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function isInteractiveTarget(target: EventTarget): boolean {
  return target instanceof Element && Boolean(target.closest("button, select, input, textarea, a"));
}

declare global {
  interface Window {
    CESIUM_BASE_URL?: string;
  }
}

function pointStyle(lon: number, lat: number, bounds: MissionSummary["bounds"]): CSSProperties {
  const left = ((lon - bounds.west) / (bounds.east - bounds.west)) * 100;
  const top = ((bounds.north - lat) / (bounds.north - bounds.south)) * 100;
  return { left: `${left}%`, top: `${top}%` };
}

function flightPointStyle(waypoint: Pick<WaypointRecord, "lon" | "lat" | "altitudeM">, bounds: MissionSummary["bounds"], terrainSamples: TerrainSample[]): CSSProperties {
  const ground = svgPoint(waypoint.lon, waypoint.lat, bounds);
  const flightY = ground.y - heightOffsetMeters(sampleGroundElevationM(waypoint.lon, waypoint.lat, terrainSamples) + (waypoint.altitudeM ?? DEFAULT_ALTITUDE_M));
  return {
    left: `${ground.x / 10}%`,
    top: `${flightY / 10}%`,
  };
}

function zoneStyle(zone: DecisionTargetZoneRecord, bounds: MissionSummary["bounds"]): CSSProperties {
  const base = pointStyle(zone.centerLon, zone.centerLat, bounds);
  const radiusPercent = Math.max(3, Math.min(12, (zone.radiusM / 5000) * 100));
  return {
    ...base,
    width: `${radiusPercent * 2}%`,
    height: `${radiusPercent * 2}%`,
  };
}

function makeRouteGeometry(waypoints: WaypointRecord[], bounds: MissionSummary["bounds"], terrainSamples: TerrainSample[]) {
  const ordered = [...waypoints].sort((a, b) => a.sequence - b.sequence);
  const routePoints = sampleRoutePoints(ordered).map((point) => {
    const mapGround = svgPoint(point.lon, point.lat, bounds);
    const groundElevationM = sampleGroundElevationM(point.lon, point.lat, terrainSamples);
    const terrainGround = {
      x: mapGround.x,
      y: mapGround.y - heightOffsetMeters(groundElevationM),
    };
    return {
      id: point.id,
      isWaypoint: point.isWaypoint,
      ground: terrainGround,
      flight: {
        x: mapGround.x,
        y: mapGround.y - heightOffsetMeters(groundElevationM + point.altitudeM),
      },
    };
  });

  return {
    groundPath: pointsToPath(routePoints.map((point) => point.ground)),
    flightPath: pointsToPath(routePoints.map((point) => point.flight)),
    tethers: routePoints.filter((point) => point.isWaypoint).map((point) => ({
      id: point.id,
      ground: point.ground,
      flight: point.flight,
    })),
  };
}

function pointsToPath(points: Array<{ x: number; y: number }>): string {
  return points
    .map((point, index) => {
      return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
    })
    .join(" ");
}

function branchSvgPaths(pkg: LaunchPackageRecord | null, branchWaypoints: BranchWaypointRecord[], bounds: MissionSummary["bounds"], terrainSamples: TerrainSample[]) {
  const authoredGroups = branchGroups(branchWaypoints);
  const authored = authoredGroups.map((group) => ({
    id: group.id,
    type: group.type,
    path: pointsToPath(sampleRoutePoints(group.waypoints).map((point) => {
      const ground = svgPoint(point.lon, point.lat, bounds);
      const elevationM = sampleGroundElevationM(point.lon, point.lat, terrainSamples);
      return { x: ground.x, y: ground.y - heightOffsetMeters(elevationM + point.altitudeM) };
    })),
  }));
  const seeded = (pkg?.routeBranches ?? []).map((branch) => {
    const coordinates = Array.isArray(branch.geometry?.coordinates) ? (branch.geometry.coordinates as number[][]) : [];
    return {
      id: branch.id,
      type: branch.type,
      path: coordinates
        .map((coordinate, index) => {
          const point = svgPoint(coordinate[0], coordinate[1], bounds);
          return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
        })
        .join(" "),
    };
  });
  return [...seeded, ...authored].filter((branch) => branch.path);
}

function branchGroups(branchWaypoints: BranchWaypointRecord[]) {
  const groups = new Map<string, { id: string; type: BranchType; waypoints: BranchWaypointRecord[] }>();
  for (const waypoint of branchWaypoints) {
    const key = `${waypoint.decisionTargetZoneId}:${waypoint.branchType}`;
    const group = groups.get(key) ?? { id: key, type: waypoint.branchType, waypoints: [] };
    group.waypoints.push(waypoint);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    waypoints: group.waypoints.sort((a, b) => a.branchSequence - b.branchSequence),
  }));
}

function svgPoint(lon: number, lat: number, bounds: MissionSummary["bounds"]) {
  return {
    x: ((lon - bounds.west) / (bounds.east - bounds.west)) * 1000,
    y: ((bounds.north - lat) / (bounds.north - bounds.south)) * 1000,
  };
}

function sampleRoutePoints(waypoints: Array<Pick<WaypointRecord, "id" | "lon" | "lat" | "altitudeM">>) {
  if (waypoints.length <= 1) {
    return waypoints.map((waypoint) => ({ id: waypoint.id, lon: waypoint.lon, lat: waypoint.lat, altitudeM: waypoint.altitudeM ?? DEFAULT_ALTITUDE_M, isWaypoint: true }));
  }

  return waypoints.flatMap((waypoint, waypointIndex) => {
    const next = waypoints[waypointIndex + 1];
    if (!next) {
      return [{ id: waypoint.id, lon: waypoint.lon, lat: waypoint.lat, altitudeM: waypoint.altitudeM ?? DEFAULT_ALTITUDE_M, isWaypoint: true }];
    }
    const samples = [];
    for (let index = 0; index < 8; index++) {
      const t = index / 8;
      samples.push({
        id: index === 0 ? waypoint.id : `${waypoint.id}-${next.id}-${index}`,
        lon: waypoint.lon + (next.lon - waypoint.lon) * t,
        lat: waypoint.lat + (next.lat - waypoint.lat) * t,
        altitudeM: (waypoint.altitudeM ?? DEFAULT_ALTITUDE_M) + ((next.altitudeM ?? DEFAULT_ALTITUDE_M) - (waypoint.altitudeM ?? DEFAULT_ALTITUDE_M)) * t,
        isWaypoint: index === 0,
      });
    }
    return samples;
  });
}

function heightOffsetMeters(heightM: number): number {
  return Math.max(18, Math.min(118, heightM / 3.5));
}

function eventToLonLat(
  rect: DOMRect,
  clientX: number,
  clientY: number,
  bounds: MissionSummary["bounds"],
  mapPanOffset: { x: number; y: number },
  groundOffsetViewBox: number,
) {
  const xRatio = (clientX - rect.left - mapPanOffset.x) / rect.width;
  const yRatio = (clientY - rect.top - mapPanOffset.y) / rect.height + groundOffsetViewBox / 1000;
  return {
    lon: bounds.west + xRatio * (bounds.east - bounds.west),
    lat: bounds.north - yRatio * (bounds.north - bounds.south),
  };
}

function clientToGroundLonLatFromFlight(
  rect: DOMRect,
  clientX: number,
  clientY: number,
  bounds: MissionSummary["bounds"],
  mapPanOffset: { x: number; y: number },
  altitudeM: number | null,
  terrainSamples: TerrainSample[],
) {
  const xRatio = (clientX - rect.left - mapPanOffset.x) / rect.width;
  const rawYRatio = (clientY - rect.top - mapPanOffset.y) / rect.height;
  const lon = bounds.west + xRatio * (bounds.east - bounds.west);
  const approximateLat = bounds.north - rawYRatio * (bounds.north - bounds.south);
  const groundOffset = heightOffsetMeters(sampleGroundElevationM(lon, approximateLat, terrainSamples) + (altitudeM ?? DEFAULT_ALTITUDE_M));
  const yRatio = rawYRatio + groundOffset / 1000;
  return {
    lon,
    lat: bounds.north - yRatio * (bounds.north - bounds.south),
  };
}

function terrainSamplesFromLayer(layer: MissionLayers["terrain"] | null): TerrainSample[] {
  return (layer?.features ?? [])
    .map((feature) => {
      if (feature.geometry?.type !== "Point" || !Array.isArray(feature.geometry.coordinates)) return null;
      const coordinates = feature.geometry.coordinates as [number, number];
      const props = feature.properties ?? {};
      const elevation = Number(props.elevationM ?? props.elevation_m ?? props.elevation ?? props.elev_m ?? props.z);
      if (!Number.isFinite(elevation)) return null;
      return { lon: coordinates[0], lat: coordinates[1], elevationM: elevation };
    })
    .filter((sample): sample is TerrainSample => sample !== null);
}

function sampleGroundElevationM(lon: number, lat: number, terrainSamples: TerrainSample[]): number {
  if (terrainSamples.length === 0) return 0;
  let weightedElevation = 0;
  let weightTotal = 0;
  for (const sample of terrainSamples) {
    const distance = Math.max(0.00001, Math.hypot((lon - sample.lon) * 88, (lat - sample.lat) * 111));
    const weight = 1 / (distance * distance);
    weightedElevation += sample.elevationM * weight;
    weightTotal += weight;
  }
  return weightTotal > 0 ? weightedElevation / weightTotal : 0;
}

function fiveKmViewport(bounds: MissionSummary["bounds"]): [number, number, number, number] {
  const centerLon = (bounds.west + bounds.east) / 2;
  const centerLat = (bounds.south + bounds.north) / 2;
  const latDelta = 2.5 / 111;
  const lonDelta = 2.5 / (111 * Math.cos((centerLat * Math.PI) / 180));
  return [centerLon - lonDelta, centerLat - latDelta, centerLon + lonDelta, centerLat + latDelta];
}

function applyCesiumMapMode(viewer: any, Cesium: any, bounds: MissionSummary["bounds"], mapMode: MapMode) {
  const controller = viewer.scene.screenSpaceCameraController;
  const viewport = fiveKmViewport(bounds);

  if (mapMode === "topo2d") {
    viewer.scene.morphTo2D(0);
    controller.enableTilt = false;
    controller.enableRotate = false;
    viewer.scene.globe.enableLighting = false;
    viewer.camera.setView({
      destination: Cesium.Rectangle.fromDegrees(...viewport),
    });
    viewer.scene.requestRender();
    return;
  }

  const centerLon = (viewport[0] + viewport[2]) / 2;
  const centerLat = (viewport[1] + viewport[3]) / 2;
  viewer.scene.morphTo3D(0);
  controller.enableTilt = true;
  controller.enableRotate = true;
  viewer.scene.globe.enableLighting = true;

  try {
    viewer.camera.lookAt(
      Cesium.Cartesian3.fromDegrees(centerLon, centerLat, 0),
      new Cesium.HeadingPitchRange(Cesium.Math.toRadians(18), Cesium.Math.toRadians(-58), 6200),
    );
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  } catch {
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat - 0.018, 5200),
      orientation: {
        heading: Cesium.Math.toRadians(18),
        pitch: Cesium.Math.toRadians(-58),
        roll: 0,
      },
    });
  }
  viewer.scene.requestRender();
}

function pickGlobeLonLat(viewer: any, Cesium: any, screenPosition: unknown): { lon: number; lat: number } | null {
  const ray = viewer.camera.getPickRay(screenPosition as never);
  const cartesian = (ray ? viewer.scene.globe.pick(ray, viewer.scene) : null) ?? viewer.camera.pickEllipsoid(screenPosition as never, viewer.scene.globe.ellipsoid);
  if (!cartesian) return null;
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  return {
    lon: Cesium.Math.toDegrees(cartographic.longitude),
    lat: Cesium.Math.toDegrees(cartographic.latitude),
  };
}

async function addGeoJson(viewer: any, Cesium: any, featureCollection: unknown, name: string, color: string) {
  const source = await Cesium.GeoJsonDataSource.load(featureCollection, {
    stroke: Cesium.Color.fromCssColorString(color).withAlpha(0.65),
    fill: Cesium.Color.fromCssColorString(color).withAlpha(0.1),
    strokeWidth: 2,
    clampToGround: true,
  });
  source.name = name;
  const tacticalColor = Cesium.Color.fromCssColorString(color);
  for (const entity of source.entities.values) {
    if (entity.billboard) {
      entity.billboard = undefined;
      entity.point = new Cesium.PointGraphics({
        pixelSize: name === "Infrastructure" ? 5 : 8,
        color: tacticalColor.withAlpha(name === "Infrastructure" ? 0.52 : 0.82),
        outlineColor: Cesium.Color.BLACK.withAlpha(0.7),
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      });
    }
    if (entity.label) {
      entity.label = undefined;
    }
    if (entity.polygon) {
      entity.polygon.outline = false;
    }
  }
  viewer.dataSources.add(source);
  return source;
}

async function addMissionGeoJsonLayers(viewer: any, Cesium: any, layers: MissionLayers) {
  return Promise.all([
    addGeoJson(viewer, Cesium, layers.aoi, "AOI", "#fff1a8"),
    addGeoJson(viewer, Cesium, layers.unitRoute, "Ground route", "#8ec07c"),
    addGeoJson(viewer, Cesium, layers.noGo, "No-go", "#ff5c5c"),
    addGeoJson(viewer, Cesium, layers.terrain, "Terrain", "#6de0d2"),
    addGeoJson(viewer, Cesium, layers.infrastructure, "Infrastructure", "#ff8f3d"),
  ]);
}

function removeMissionDataSources(viewer: any, sources: any[]) {
  for (const source of sources) {
    viewer.dataSources.remove(source, true);
  }
}

function removePackageDataSource(viewer: any) {
  const source = viewer.__rebuildPlannerPackageSource;
  if (source) {
    viewer.dataSources.remove(source, true);
    viewer.__rebuildPlannerPackageSource = null;
  }
}

function drawCesiumPackageGraphics({
  Cesium,
  activeBranchType,
  activePackage,
  bounds,
  displayBranchWaypoints,
  displayWaypoints,
  selectedBranchWaypointId,
  selectedWaypointId,
  selectedZoneId,
  terrainSamples,
  viewer,
  packageDataSourceRef,
}: {
  Cesium: any;
  activeBranchType: string | null;
  activePackage: LaunchPackageRecord | null;
  bounds: MissionSummary["bounds"];
  displayBranchWaypoints: BranchWaypointRecord[];
  displayWaypoints: WaypointRecord[];
  selectedBranchWaypointId: string | null;
  selectedWaypointId: string | null;
  selectedZoneId: string | null;
  terrainSamples: TerrainSample[];
  viewer: any;
  packageDataSourceRef: MutableRefObject<any | null>;
}) {
  if (packageDataSourceRef.current) {
    viewer.dataSources.remove(packageDataSourceRef.current, true);
    packageDataSourceRef.current = null;
  }
  if (!activePackage) return;

  const dataSource = new Cesium.CustomDataSource("Selected mission plan");
  packageDataSourceRef.current = dataSource;
  viewer.__rebuildPlannerPackageSource = dataSource;

  const routeSamples = sampleRoutePoints(displayWaypoints);
  if (routeSamples.length > 1) {
    dataSource.entities.add({
      id: "selected-plan-ground-route",
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(routeSamples.flatMap((point) => [point.lon, point.lat])),
        clampToGround: true,
        width: 3,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.fromCssColorString("#eef1eb").withAlpha(0.64),
          dashLength: 12,
        }),
      },
    });

    dataSource.entities.add({
      id: "selected-plan-flight-route",
      polyline: {
        positions: routeSamples.map((point) =>
          Cesium.Cartesian3.fromDegrees(
            point.lon,
            point.lat,
            sampleGroundElevationM(point.lon, point.lat, terrainSamples) + point.altitudeM,
          ),
        ),
        width: 5,
        material: Cesium.Color.fromCssColorString("#fbbf24").withAlpha(0.96),
      },
    });
  }

  for (const branch of activePackage.routeBranches) {
    const coordinates = Array.isArray(branch.geometry?.coordinates) ? (branch.geometry.coordinates as number[][]) : [];
    if (coordinates.length < 2) continue;
    const active = branch.type === activeBranchType;
    dataSource.entities.add({
      id: `branch-${branch.id}`,
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(coordinates.flatMap((coordinate) => [coordinate[0], coordinate[1]])),
        clampToGround: true,
        width: active ? 5 : 3,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.fromCssColorString(active ? "#6de0d2" : "#fff1a8").withAlpha(active ? 0.92 : 0.42),
          dashLength: active ? 24 : 18,
        }),
      },
    });
  }

  for (const branch of branchGroups(displayBranchWaypoints)) {
    const routeSamples = sampleRoutePoints(branch.waypoints);
    if (routeSamples.length < 1) continue;
    const active = branch.type === activeBranchType;
    if (routeSamples.length > 1) {
      dataSource.entities.add({
        id: `branch-waypoint-path-${branch.id}`,
        polyline: {
          positions: routeSamples.map((point) =>
            Cesium.Cartesian3.fromDegrees(
              point.lon,
              point.lat,
              sampleGroundElevationM(point.lon, point.lat, terrainSamples) + point.altitudeM,
            ),
          ),
          width: active ? 5 : 3,
          material: new Cesium.PolylineDashMaterialProperty({
            color: Cesium.Color.fromCssColorString(active ? "#6de0d2" : branchColor(branch.type)).withAlpha(active ? 0.92 : 0.72),
            dashLength: active ? 24 : 18,
          }),
        },
      });
    }
  }

  for (const decisionPoint of activePackage.decisionPoints) {
    for (const zone of decisionPoint.targetZones) {
      const selected = zone.id === selectedZoneId;
      dataSource.entities.add({
        id: `zone-${zone.id}`,
        position: Cesium.Cartesian3.fromDegrees(zone.centerLon, zone.centerLat, 0),
        properties: {
          plannerKind: "decision-zone",
          zoneId: zone.id,
        },
        ellipse: {
          semiMajorAxis: zone.radiusM,
          semiMinorAxis: zone.radiusM,
          material: Cesium.Color.fromCssColorString("#fff1a8").withAlpha(selected ? 0.22 : 0.11),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(selected ? "#6de0d2" : "#fff1a8").withAlpha(0.9),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: zone.name,
          fillColor: Cesium.Color.fromCssColorString("#fff1a8"),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          font: "700 12px Segoe UI, sans-serif",
          pixelOffset: new Cesium.Cartesian2(0, 0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
    }
  }

  for (const waypoint of displayWaypoints) {
    const behavior = behaviorByType[waypoint.behavior];
    const groundElevationM = sampleGroundElevationM(waypoint.lon, waypoint.lat, terrainSamples);
    const altitudeM = waypoint.altitudeM ?? DEFAULT_ALTITUDE_M;
    const selected = waypoint.id === selectedWaypointId;

    dataSource.entities.add({
      id: `tether-${waypoint.id}`,
      polyline: {
        positions: [
          Cesium.Cartesian3.fromDegrees(waypoint.lon, waypoint.lat, groundElevationM),
          Cesium.Cartesian3.fromDegrees(waypoint.lon, waypoint.lat, groundElevationM + altitudeM),
        ],
        width: 2,
        material: new Cesium.PolylineDashMaterialProperty({
          color: Cesium.Color.fromCssColorString("#7ee7ff").withAlpha(0.5),
          dashLength: 10,
        }),
      },
    });

    dataSource.entities.add({
      id: `waypoint-${waypoint.id}`,
      position: Cesium.Cartesian3.fromDegrees(waypoint.lon, waypoint.lat, groundElevationM + altitudeM),
      properties: {
        plannerKind: "waypoint",
        waypointId: waypoint.id,
        altitudeM,
      },
      billboard: {
        image: waypointBillboardSvg(behavior.color, behavior.shortLabel, selected),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        scale: selected ? 1.12 : 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: `${waypoint.sequence}`,
        fillColor: Cesium.Color.BLACK,
        font: "900 11px Segoe UI, sans-serif",
        pixelOffset: new Cesium.Cartesian2(0, -16),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }

  for (const waypoint of displayBranchWaypoints) {
    const groundElevationM = sampleGroundElevationM(waypoint.lon, waypoint.lat, terrainSamples);
    const altitudeM = waypoint.altitudeM ?? DEFAULT_ALTITUDE_M;
    const selected = waypoint.id === selectedBranchWaypointId;
    const color = branchColor(waypoint.branchType);

    dataSource.entities.add({
      id: `branch-waypoint-${waypoint.id}`,
      position: Cesium.Cartesian3.fromDegrees(waypoint.lon, waypoint.lat, groundElevationM + altitudeM),
      properties: {
        plannerKind: "branch-waypoint",
        branchWaypointId: waypoint.id,
        altitudeM,
      },
      billboard: {
        image: waypointBillboardSvg(color, `${waypoint.branchSequence}`, selected),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        scale: selected ? 1.02 : 0.82,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: waypoint.branchType.toUpperCase(),
        fillColor: Cesium.Color.fromCssColorString(color),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        font: "800 10px Segoe UI, sans-serif",
        pixelOffset: new Cesium.Cartesian2(0, -34),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }

  viewer.dataSources.add(dataSource);
  viewer.scene.requestRender();
}

function getEntityProperty(entity: any, propertyName: string) {
  if (!entity?.properties) return undefined;
  const values = typeof entity.properties.getValue === "function" ? entity.properties.getValue() : entity.properties;
  return values?.[propertyName];
}

function branchColor(branchType: BranchType): string {
  if (branchType === "primary") return "#6de0d2";
  if (branchType === "alternate") return "#a78bfa";
  if (branchType === "hold") return "#fb923c";
  return "#60a5fa";
}

function waypointBillboardSvg(color: string, shortLabel: string, selected: boolean) {
  const ring = selected ? `<circle cx="32" cy="32" r="28" fill="none" stroke="#6de0d2" stroke-width="6"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="76" viewBox="0 0 64 76">
    ${ring}
    <circle cx="32" cy="32" r="24" fill="rgba(6,9,8,0.9)" stroke="${color}" stroke-width="5"/>
    <path d="M32 58 24 44h16z" fill="${color}"/>
    <text x="32" y="38" text-anchor="middle" font-family="Segoe UI,Arial,sans-serif" font-size="16" font-weight="900" fill="${color}">${shortLabel}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
