/*
Module Context
Purpose:
- Render mission layers in Cesium with stable 2D topo planning and 3D terrain review modes.
Why This Exists:
- Goal 0002 requires a 3D route-planning surface centered on the Sunol AOI without Palantir access.
Primary Inputs/Outputs:
- Inputs: MissionLayer GeoJSON, enabled layer ids, optional VITE_CESIUM_ION_TOKEN, selection and cursor callbacks.
- Outputs: Cesium Viewer with topo imagery, optional Cesium World Terrain, styled AOI, route, infrastructure, terrain, cue, no-go overlays, and WGS84 pointer/selection coordinates.
Research / Source Links:
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Typechecked and built in Goal 0002; browser rendering should be smoke-tested locally.
Current Limits / TODO:
- Topo mode uses public topo imagery; 3D mode switches to satellite imagery and uses Cesium ion terrain when VITE_CESIUM_ION_TOKEN is configured.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import { useEffect, useRef, useState } from "react";
import {
  Cartesian3,
  Cartographic,
  Color,
  ColorMaterialProperty,
  ConstantProperty,
  createWorldImageryAsync,
  EllipsoidTerrainProvider,
  GeoJsonDataSource,
  ImageryLayer,
  Ion,
  IonWorldImageryStyle,
  JulianDate,
  Math as CesiumMath,
  PolylineDashMaterialProperty,
  Rectangle,
  SceneMode,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Terrain,
  UrlTemplateImageryProvider,
  Viewer,
  type Cartesian2,
  type Entity,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import {
  SUNOL_AOI_CENTER,
  SUNOL_AOI_RECTANGLE_DEGREES,
  type MapViewMode,
  terrainSourceStatus,
} from "../data/mapView";
import type { LayerId, MissionLayer, SelectedMissionObject } from "../data/missionTypes";
import type { Wgs84DisplayCoordinate } from "../data/coordinateFormat";

interface CesiumMissionMapProps {
  layers: MissionLayer[];
  enabledLayerIds: Set<LayerId>;
  onPointerCoordinate: (coordinate: Wgs84DisplayCoordinate | null) => void;
  onSelectObject: (selected: SelectedMissionObject | null) => void;
}

export function CesiumMissionMap({ layers, enabledLayerIds, onPointerCoordinate, onSelectObject }: CesiumMissionMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const baseImageryLayerRef = useRef<ImageryLayer | null>(null);
  const ionTokenRef = useRef<string | undefined>(undefined);
  const [viewMode, setViewMode] = useState<MapViewMode>(() => readInitialViewMode());
  const [terrainStatus] = useState(() => terrainSourceStatus(readIonToken()));

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const ionToken = configureIonToken();
    const initialViewMode = readInitialViewMode();
    const baseLayer = initialViewMode === "terrain3d" ? createSatelliteBaseLayer(ionToken) : createTopoBaseLayer(ionToken);
    ionTokenRef.current = ionToken;
    baseImageryLayerRef.current = baseLayer;
    const viewer = new Viewer(containerRef.current, {
      animation: false,
      baseLayer,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      navigationHelpButton: false,
      sceneMode: initialViewMode === "terrain3d" ? SceneMode.SCENE3D : SceneMode.SCENE2D,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      terrain: ionToken ? Terrain.fromWorldTerrain({ requestVertexNormals: true }) : undefined,
      terrainProvider: ionToken ? undefined : new EllipsoidTerrainProvider(),
      requestRenderMode: true,
      maximumRenderTimeChange: Number.POSITIVE_INFINITY,
    });

    viewer.scene.globe.baseColor = Color.fromCssColorString("#15211d");
    viewer.scene.backgroundColor = Color.fromCssColorString("#101312");
    viewer.clock.shouldAnimate = false;
    viewer.scene.screenSpaceCameraController.inertiaSpin = 0;
    viewer.scene.screenSpaceCameraController.inertiaTranslate = 0;
    viewer.scene.screenSpaceCameraController.inertiaZoom = 0;
    applyMapView(viewer, initialViewMode, 0);

    viewer.selectedEntityChanged.addEventListener((entity) => {
      onSelectObject(entity ? selectedObjectFromEntity(entity) : null);
    });

    const pointerHandler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    pointerHandler.setInputAction((movement: { endPosition?: Cartesian2 }) => {
      const coordinate = movement.endPosition ? coordinateFromCanvasPosition(viewer, movement.endPosition) : null;
      onPointerCoordinate(coordinate);
    }, ScreenSpaceEventType.MOUSE_MOVE);

    viewerRef.current = viewer;

    return () => {
      pointerHandler.destroy();
      viewer.destroy();
      viewerRef.current = null;
      baseImageryLayerRef.current = null;
      ionTokenRef.current = undefined;
    };
  }, [onPointerCoordinate, onSelectObject]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const activeViewer = viewer;

    let cancelled = false;
    const addedSources: GeoJsonDataSource[] = [];

    activeViewer.dataSources.removeAll(false);

    async function loadLayers() {
      for (const layer of layers) {
        if (!enabledLayerIds.has(layer.id) || layer.geojson.features.length === 0) continue;
        const dataSource = await GeoJsonDataSource.load(layer.geojson, {
          clampToGround: false,
          stroke: color(layer.style.stroke, layer.style.strokeAlpha ?? 1),
          fill: color(layer.style.fill || layer.style.stroke, layer.style.fillAlpha ?? 0.12),
          markerColor: color(layer.style.pointColor || layer.style.stroke, 0.96),
          markerSize: 18,
          strokeWidth: layer.style.strokeWidth,
        });

        if (cancelled) {
          return;
        }

        dataSource.name = layer.label;
        for (const entity of dataSource.entities.values) {
          entity.properties?.addProperty("planner_layer_id", layer.id);
          entity.properties?.addProperty("planner_layer_label", layer.label);
          styleEntity(entity, layer);
        }
        activeViewer.dataSources.add(dataSource);
        addedSources.push(dataSource);
      }
      activeViewer.scene.requestRender();
    }

    void loadLayers();

    return () => {
      cancelled = true;
      for (const source of addedSources) {
        activeViewer.dataSources.remove(source, true);
      }
    };
  }, [enabledLayerIds, layers]);

  function changeMapView(nextMode: MapViewMode) {
    setViewMode(nextMode);
    if (viewerRef.current) {
      switchBaseImagery(viewerRef.current, nextMode);
      applyMapView(viewerRef.current, nextMode, 0.5);
    }
  }

  function recenterMap() {
    if (viewerRef.current) applyMapView(viewerRef.current, viewMode, 0.35);
  }

  return (
    <div className="cesium-map-shell" role="application" aria-label="Cesium mission map">
      <div className="cesium-map" ref={containerRef} />
      <div className="map-mode-controls" aria-label="Map view controls">
        <div className="map-mode-switch">
          <button className={viewMode === "topo" ? "is-active" : ""} onClick={() => changeMapView("topo")} type="button">
            Topo
          </button>
          <button className={viewMode === "terrain3d" ? "is-active" : ""} onClick={() => changeMapView("terrain3d")} type="button">
            3D Sat
          </button>
        </div>
        <button className="map-recenter" onClick={recenterMap} type="button">
          Recenter AOI
        </button>
        <span className={`terrain-status terrain-status-${terrainStatus}`}>
          {viewMode === "terrain3d"
            ? terrainStatus === "cesium_world_terrain"
              ? "Satellite + terrain"
              : "Satellite + ellipsoid"
            : "Topo planning"}
        </span>
      </div>
    </div>
  );

  function switchBaseImagery(viewer: Viewer, mode: MapViewMode) {
    const nextLayer = mode === "terrain3d" ? createSatelliteBaseLayer(ionTokenRef.current) : createTopoBaseLayer(ionTokenRef.current);
    const layers = viewer.imageryLayers;
    const currentLayer = baseImageryLayerRef.current;

    if (currentLayer && layers.contains(currentLayer)) {
      layers.remove(currentLayer, true);
    } else if (layers.length > 0) {
      layers.remove(layers.get(0), true);
    }

    layers.add(nextLayer, 0);
    baseImageryLayerRef.current = nextLayer;
    viewer.scene.requestRender();
  }
}

function styleEntity(entity: Entity, layer: MissionLayer) {
  if (entity.polyline) {
    const stroke = color(layer.style.stroke, layer.style.strokeAlpha ?? 1);
    entity.polyline.width = new ConstantProperty(layer.style.strokeWidth);
    entity.polyline.material = layer.style.dashed
      ? new PolylineDashMaterialProperty({ color: stroke, dashLength: 18 })
      : new ColorMaterialProperty(stroke);
  }

  if (entity.polygon) {
    entity.polygon.material = new ColorMaterialProperty(color(layer.style.fill || layer.style.stroke, layer.style.fillAlpha ?? 0.12));
    entity.polygon.outline = new ConstantProperty(true);
    entity.polygon.outlineColor = new ConstantProperty(color(layer.style.stroke, layer.style.strokeAlpha ?? 1));
  }

  if (entity.point) {
    entity.point.color = new ConstantProperty(color(layer.style.pointColor || layer.style.stroke, 0.95));
    entity.point.pixelSize = new ConstantProperty(9);
  }
}

function selectedObjectFromEntity(entity: Entity): SelectedMissionObject {
  const properties = entity.properties?.getValue() as Record<string, unknown> | undefined;
  const layerId = String(properties?.planner_layer_id || "aoi") as LayerId;
  return {
    layerId,
    layerLabel: String(properties?.planner_layer_label || "Layer"),
    objectId: String(entity.id),
    name: String(properties?.name || entity.name || entity.id),
    coordinate: representativeEntityCoordinate(entity),
    properties: properties || {},
  };
}

function color(css: string, alpha = 1): Color {
  return Color.fromCssColorString(css).withAlpha(alpha);
}

function configureIonToken(): string | undefined {
  const token = readIonToken();
  if (!token) return undefined;
  Ion.defaultAccessToken = token;
  return token;
}

function readIonToken(): string | undefined {
  return import.meta.env.VITE_CESIUM_ION_TOKEN?.trim() || undefined;
}

function readInitialViewMode(): MapViewMode {
  if (typeof window === "undefined") return "topo";
  const view = new URLSearchParams(window.location.search).get("view")?.toLowerCase();
  return view === "3d" || view === "terrain3d" ? "terrain3d" : "topo";
}

function createTopoBaseLayer(ionToken: string | undefined): ImageryLayer {
  return new ImageryLayer(
    new UrlTemplateImageryProvider({
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      subdomains: ["a", "b", "c"],
      credit: ionToken ? "OpenTopoMap contributors; Cesium World Terrain" : "OpenTopoMap contributors",
      maximumLevel: 17,
    }),
  );
}

function createSatelliteBaseLayer(ionToken: string | undefined): ImageryLayer {
  if (ionToken) {
    return ImageryLayer.fromProviderAsync(createWorldImageryAsync({ style: IonWorldImageryStyle.AERIAL_WITH_LABELS }));
  }

  return new ImageryLayer(
    new UrlTemplateImageryProvider({
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      credit: "Esri World Imagery",
      maximumLevel: 19,
    }),
  );
}

function applyMapView(viewer: Viewer, mode: MapViewMode, duration: number) {
  if (mode === "topo") {
    viewer.scene.morphTo2D(0);
    viewer.scene.screenSpaceCameraController.enableTilt = false;
    viewer.scene.screenSpaceCameraController.enableRotate = false;
    viewer.camera.setView({
      destination: sunolAoiRectangle(),
    });
    viewer.scene.requestRender();
    return;
  }

  viewer.scene.morphTo3D(0);
  viewer.scene.screenSpaceCameraController.enableTilt = true;
  viewer.scene.screenSpaceCameraController.enableRotate = true;
  viewer.camera.flyTo({
    destination: Cartesian3.fromDegrees(SUNOL_AOI_CENTER.lon, SUNOL_AOI_CENTER.lat - 0.06, 24_000),
    duration,
    orientation: {
      heading: 0,
      pitch: CesiumMath.toRadians(-58),
      roll: 0,
    },
  });
}

function sunolAoiRectangle(): Rectangle {
  const { west, south, east, north } = SUNOL_AOI_RECTANGLE_DEGREES;
  return Rectangle.fromDegrees(west, south, east, north);
}

function coordinateFromCanvasPosition(viewer: Viewer, endPosition: Cartesian2): Wgs84DisplayCoordinate | null {
  const cartesian = viewer.camera.pickEllipsoid(endPosition, viewer.scene.globe.ellipsoid);
  return cartesian ? coordinateFromCartesian(cartesian) : null;
}

function representativeEntityCoordinate(entity: Entity): Wgs84DisplayCoordinate | undefined {
  const time = JulianDate.now();
  const position = entity.position?.getValue(time);
  if (position) return coordinateFromCartesian(position);

  const polylinePositions = entity.polyline?.positions?.getValue(time);
  if (Array.isArray(polylinePositions) && polylinePositions.length > 0) {
    return averageCoordinate(polylinePositions);
  }

  const polygonHierarchy = entity.polygon?.hierarchy?.getValue(time);
  const polygonPositions = polygonHierarchy?.positions;
  if (Array.isArray(polygonPositions) && polygonPositions.length > 0) {
    return averageCoordinate(polygonPositions);
  }

  return undefined;
}

function averageCoordinate(positions: Cartesian3[]): Wgs84DisplayCoordinate {
  const coordinates = positions.map(coordinateFromCartesian);
  const total = coordinates.reduce<{ lat: number; lon: number; elevationMeters: number; elevationCount: number }>(
    (sum, coordinate) => {
      const elevationMeters = coordinate.elevationMeters;
      const hasElevation = elevationMeters !== undefined && Number.isFinite(elevationMeters);
      return {
        lat: sum.lat + coordinate.lat,
        lon: sum.lon + coordinate.lon,
        elevationMeters: sum.elevationMeters + (hasElevation ? elevationMeters : 0),
        elevationCount: sum.elevationCount + (hasElevation ? 1 : 0),
      };
    },
    { lat: 0, lon: 0, elevationMeters: 0, elevationCount: 0 },
  );
  return {
    lat: total.lat / coordinates.length,
    lon: total.lon / coordinates.length,
    elevationMeters: total.elevationCount === 0 ? undefined : total.elevationMeters / total.elevationCount,
  };
}

function coordinateFromCartesian(cartesian: Cartesian3): Wgs84DisplayCoordinate {
  const cartographic = Cartographic.fromCartesian(cartesian);
  return {
    lat: CesiumMath.toDegrees(cartographic.latitude),
    lon: CesiumMath.toDegrees(cartographic.longitude),
    elevationMeters: cartographic.height,
  };
}
