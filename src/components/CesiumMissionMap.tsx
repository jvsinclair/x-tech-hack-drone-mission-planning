/*
Module Context
Purpose:
- Render mission layers in Cesium with stable 2D topo planning and 3D terrain review modes.
Why This Exists:
- Goals 0002 and 0005 require a 3D route-planning surface centered on the Sunol AOI with cue-zone and route-preview overlays.
Primary Inputs/Outputs:
- Inputs: MissionLayer GeoJSON, enabled layer ids, active command preview, optional VITE_CESIUM_ION_TOKEN, selection and cursor callbacks.
- Outputs: Cesium Viewer with topo imagery, optional Cesium World Terrain, styled AOI, route, infrastructure, terrain, cue, no-go overlays, line-of-sight preview rays, labels, and WGS84 pointer/selection coordinates.
Research / Source Links:
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/goals/0005-pps-cue-zones-and-route-preview.md
- docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Typechecked and built in Goal 0002; browser rendering should be smoke-tested locally.
Current Limits / TODO:
- Topo mode uses public topo imagery; route-branch altitude is still ground-level until goal 0008.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import { useEffect, useRef, useState } from "react";
import {
  Cartesian3,
  Cartesian2,
  Cartographic,
  Color,
  ColorMaterialProperty,
  ConstantPositionProperty,
  ConstantProperty,
  createWorldImageryAsync,
  EllipsoidTerrainProvider,
  GeoJsonDataSource,
  HeightReference,
  ImageryLayer,
  Ion,
  IonWorldImageryStyle,
  JulianDate,
  LabelGraphics,
  LabelStyle,
  Math as CesiumMath,
  PolylineDashMaterialProperty,
  Rectangle,
  SceneMode,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Terrain,
  UrlTemplateImageryProvider,
  VerticalOrigin,
  Viewer,
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
import {
  commandPreviewFromProperties,
  cuePpsFromProperties,
  featureDisplayName,
  firstFeatureCoordinate,
  propertyString,
  representativeFeatureCoordinate,
} from "../data/missionGeojson";
import { formatPpsCueCommand } from "../data/ppsCuePreview";

interface CesiumMissionMapProps {
  layers: MissionLayer[];
  enabledLayerIds: Set<LayerId>;
  activeCommandPreview?: string;
  onPointerCoordinate: (coordinate: Wgs84DisplayCoordinate | null) => void;
  onSelectObject: (selected: SelectedMissionObject | null) => void;
}

export function CesiumMissionMap({ activeCommandPreview, layers, enabledLayerIds, onPointerCoordinate, onSelectObject }: CesiumMissionMapProps) {
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
          clampToGround: layer.id === "cueZones" || layer.id === "noGoZones" || layer.id === "aoi",
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
          styleEntity(entity, layer, activeCommandPreview);
        }
        activeViewer.dataSources.add(dataSource);
        addedSources.push(dataSource);
      }

      const sightline = createCueSightline(layers, activeCommandPreview);
      if (sightline && enabledLayerIds.has("cueZones") && enabledLayerIds.has("droneBranches")) {
        const dataSource = await GeoJsonDataSource.load(sightline, {
          clampToGround: false,
          stroke: color("#7ee7ff", 0.92),
          strokeWidth: 2,
        });
        if (cancelled) return;
        dataSource.name = "Simulated cue line of sight";
        for (const entity of dataSource.entities.values) {
          styleSightlineEntity(entity);
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
  }, [activeCommandPreview, enabledLayerIds, layers]);

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

function styleEntity(entity: Entity, layer: MissionLayer, activeCommandPreview: string | undefined) {
  const properties = entity.properties?.getValue() as Record<string, unknown> | undefined;
  const commandPreview = commandPreviewFromProperties(properties);
  const isActivePreview = Boolean(commandPreview && commandPreview === activeCommandPreview);

  if (entity.polyline) {
    const stroke = commandPreview ? previewColor(commandPreview, isActivePreview ? 0.96 : 0.5) : color(layer.style.stroke, layer.style.strokeAlpha ?? 1);
    entity.polyline.width = new ConstantProperty(layer.style.strokeWidth + (isActivePreview ? 2 : 0));
    entity.polyline.material = layer.style.dashed || commandPreview
      ? new PolylineDashMaterialProperty({ color: stroke, dashLength: isActivePreview ? 26 : 18 })
      : new ColorMaterialProperty(stroke);
  }

  if (entity.polygon) {
    const fillAlpha = isActivePreview ? 0.28 : layer.style.fillAlpha ?? 0.12;
    entity.polygon.material = new ColorMaterialProperty(color(layer.style.fill || layer.style.stroke, fillAlpha));
    entity.polygon.outline = new ConstantProperty(true);
    entity.polygon.outlineColor = new ConstantProperty(
      commandPreview ? previewColor(commandPreview, isActivePreview ? 0.98 : 0.72) : color(layer.style.stroke, layer.style.strokeAlpha ?? 1),
    );
  }

  if (entity.point) {
    entity.point.color = new ConstantProperty(commandPreview ? previewColor(commandPreview, isActivePreview ? 1 : 0.7) : color(layer.style.pointColor || layer.style.stroke, 0.95));
    entity.point.pixelSize = new ConstantProperty(isActivePreview ? 12 : 9);
  }

  const labelText = entityLabelText(layer, properties);
  if (labelText) addEntityLabel(entity, labelText, isActivePreview, commandPreview);
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

function styleSightlineEntity(entity: Entity) {
  if (entity.polyline) {
    entity.polyline.width = new ConstantProperty(2);
    entity.polyline.material = new PolylineDashMaterialProperty({ color: color("#7ee7ff", 0.9), dashLength: 12 });
  }
  addEntityLabel(entity, String(entity.properties?.getValue()?.name || "Simulated cue LOS"), true, "preview_los");
}

function addEntityLabel(entity: Entity, text: string, emphasized: boolean, commandPreview: string | undefined) {
  if (!entity.position) {
    const coordinate = representativeEntityCoordinate(entity);
    if (coordinate) {
      entity.position = new ConstantPositionProperty(Cartesian3.fromDegrees(coordinate.lon, coordinate.lat, coordinate.elevationMeters || 0));
    }
  }

  entity.label = new LabelGraphics({
    text,
    font: emphasized ? "700 13px Segoe UI, sans-serif" : "600 12px Segoe UI, sans-serif",
    style: LabelStyle.FILL_AND_OUTLINE,
    fillColor: commandPreview ? previewColor(commandPreview, emphasized ? 1 : 0.86) : Color.WHITE,
    outlineColor: Color.BLACK.withAlpha(0.86),
    outlineWidth: 2,
    showBackground: emphasized,
    backgroundColor: Color.BLACK.withAlpha(0.58),
    backgroundPadding: new Cartesian2(6, 4),
    pixelOffset: new Cartesian2(0, -18),
    verticalOrigin: VerticalOrigin.BOTTOM,
    heightReference: HeightReference.NONE,
    disableDepthTestDistance: Number.POSITIVE_INFINITY,
  });
}

function entityLabelText(layer: MissionLayer, properties: Record<string, unknown> | undefined): string | undefined {
  const commandPreview = commandPreviewFromProperties(properties);
  if (layer.id === "cueZones") {
    const pps = cuePpsFromProperties(properties);
    const ppsLabel = propertyString(properties, "ppsLabel") || (pps ? `${pps} PPS` : "PPS");
    return `Simulated PEQ-15 cue | ${ppsLabel} | ${formatPpsCueCommand(commandPreview)}`;
  }

  if (layer.id === "droneBranches" && commandPreview) {
    return `${propertyString(properties, "branchLabel", "name") || formatPpsCueCommand(commandPreview)} | preview`;
  }

  if (layer.id === "droneBranches" && properties?.sequence !== undefined) {
    return `${properties.sequence} ${propertyString(properties, "name", "action") || "Waypoint"}`;
  }

  return undefined;
}

function createCueSightline(layers: MissionLayer[], activeCommandPreview: string | undefined) {
  if (!activeCommandPreview) return null;

  const cueFeature = layers
    .find((layer) => layer.id === "cueZones")
    ?.geojson.features.find((feature) => commandPreviewFromProperties(feature.properties) === activeCommandPreview);
  const branchFeature = layers
    .find((layer) => layer.id === "droneBranches")
    ?.geojson.features.find((feature) => feature.geometry?.type === "LineString" && commandPreviewFromProperties(feature.properties) === activeCommandPreview);

  const cueCoordinate = cueFeature ? representativeFeatureCoordinate(cueFeature) : undefined;
  const decisionCoordinate = branchFeature ? firstFeatureCoordinate(branchFeature) : undefined;
  if (!cueCoordinate || !decisionCoordinate) return null;

  return {
    type: "FeatureCollection" as const,
    features: [
      {
        type: "Feature" as const,
        id: `cue-los-${activeCommandPreview}`,
        geometry: {
          type: "LineString" as const,
          coordinates: [
            [cueCoordinate.lon, cueCoordinate.lat],
            [decisionCoordinate.lon, decisionCoordinate.lat],
          ],
        },
        properties: {
          id: `cue-los-${activeCommandPreview}`,
          name: `Simulated PEQ-15 cue | ${cueFeature ? featureDisplayName(cueFeature) : "cue zone"} | line of sight`,
          commandPreview: activeCommandPreview,
          preview: true,
        },
      },
    ],
  };
}

function previewColor(commandPreview: string, alpha = 1): Color {
  if (commandPreview === "preview_route_a") return color("#8ec07c", alpha);
  if (commandPreview === "preview_route_b") return color("#6de0d2", alpha);
  if (commandPreview === "preview_return_to_base") return color("#ff9d5c", alpha);
  if (commandPreview === "preview_hold_or_loiter") return color("#ffd166", alpha);
  return color("#7ee7ff", alpha);
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
