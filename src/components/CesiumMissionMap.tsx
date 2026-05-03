/*
Module Context
Purpose:
- Render mission layers in Cesium with stable 2D topo planning and 3D terrain review modes.
Why This Exists:
- Goal 0002 requires a 3D route-planning surface centered on the Sunol AOI without Palantir access.
Primary Inputs/Outputs:
- Inputs: MissionLayer GeoJSON, enabled layer ids, optional VITE_CESIUM_ION_TOKEN, selection callback.
- Outputs: Cesium Viewer with topo imagery, optional Cesium World Terrain, styled AOI, route, infrastructure, terrain, cue, and no-go overlays.
Research / Source Links:
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Typechecked and built in Goal 0002; browser rendering should be smoke-tested locally.
Current Limits / TODO:
- Uses public topo imagery for the planning base; 3D terrain uses Cesium ion when VITE_CESIUM_ION_TOKEN is configured, otherwise falls back to ellipsoid terrain.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import { useEffect, useRef, useState } from "react";
import {
  Cartesian3,
  Color,
  ColorMaterialProperty,
  ConstantProperty,
  EllipsoidTerrainProvider,
  GeoJsonDataSource,
  ImageryLayer,
  Ion,
  Math as CesiumMath,
  PolylineDashMaterialProperty,
  Rectangle,
  SceneMode,
  Terrain,
  UrlTemplateImageryProvider,
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

interface CesiumMissionMapProps {
  layers: MissionLayer[];
  enabledLayerIds: Set<LayerId>;
  onSelectObject: (selected: SelectedMissionObject | null) => void;
}

export function CesiumMissionMap({ layers, enabledLayerIds, onSelectObject }: CesiumMissionMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const [viewMode, setViewMode] = useState<MapViewMode>("topo");
  const [terrainStatus] = useState(() => terrainSourceStatus(readIonToken()));

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const ionToken = configureIonToken();
    const viewer = new Viewer(containerRef.current, {
      animation: false,
      baseLayer: createBaseLayer(ionToken),
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      navigationHelpButton: false,
      sceneMode: SceneMode.SCENE2D,
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
    applyMapView(viewer, "topo", 0);

    viewer.selectedEntityChanged.addEventListener((entity) => {
      onSelectObject(entity ? selectedObjectFromEntity(entity) : null);
    });

    viewerRef.current = viewer;

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [onSelectObject]);

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
    if (viewerRef.current) applyMapView(viewerRef.current, nextMode, 0.5);
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
            3D
          </button>
        </div>
        <button className="map-recenter" onClick={recenterMap} type="button">
          Recenter AOI
        </button>
        <span className={`terrain-status terrain-status-${terrainStatus}`}>
          {terrainStatus === "cesium_world_terrain" ? "Cesium terrain" : "Ellipsoid terrain"}
        </span>
      </div>
    </div>
  );
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

function createBaseLayer(ionToken: string | undefined): ImageryLayer {
  return new ImageryLayer(
    new UrlTemplateImageryProvider({
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      subdomains: ["a", "b", "c"],
      credit: ionToken ? "OpenTopoMap contributors; Cesium World Terrain" : "OpenTopoMap contributors",
      maximumLevel: 17,
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
