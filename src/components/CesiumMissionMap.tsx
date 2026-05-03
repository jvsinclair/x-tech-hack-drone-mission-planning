/*
Module Context
Purpose:
- Render mission layers in a Cesium 3D globe view.
Why This Exists:
- Goal 0002 requires a 3D route-planning surface centered on the Sunol AOI without Palantir access.
Primary Inputs/Outputs:
- Inputs: MissionLayer GeoJSON, enabled layer ids, optional VITE_CESIUM_ION_TOKEN, selection callback.
- Outputs: Cesium Viewer with base imagery/terrain, styled AOI, route, infrastructure, terrain, cue, and no-go overlays.
Research / Source Links:
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Typechecked and built in Goal 0002; browser rendering should be smoke-tested locally.
Current Limits / TODO:
- Uses Cesium ion imagery/terrain when VITE_CESIUM_ION_TOKEN is configured; otherwise falls back to OpenStreetMap imagery and ellipsoid terrain.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import { useEffect, useRef } from "react";
import {
  Cartesian3,
  Color,
  ColorMaterialProperty,
  ConstantProperty,
  EllipsoidTerrainProvider,
  GeoJsonDataSource,
  ImageryLayer,
  Ion,
  OpenStreetMapImageryProvider,
  PolylineDashMaterialProperty,
  Terrain,
  Viewer,
  type Entity,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import type { LayerId, MissionLayer, SelectedMissionObject } from "../data/missionTypes";

interface CesiumMissionMapProps {
  layers: MissionLayer[];
  enabledLayerIds: Set<LayerId>;
  onSelectObject: (selected: SelectedMissionObject | null) => void;
}

const startCoordinate = {
  lat: 37.504646,
  lon: -121.832739,
};
const sunolCameraDestination = Cartesian3.fromDegrees(startCoordinate.lon, startCoordinate.lat, 11_500);

export function CesiumMissionMap({ layers, enabledLayerIds, onSelectObject }: CesiumMissionMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<Viewer | null>(null);

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
      sceneModePicker: true,
      selectionIndicator: false,
      timeline: false,
      terrain: ionToken ? Terrain.fromWorldTerrain({ requestVertexNormals: true }) : undefined,
      terrainProvider: ionToken ? undefined : new EllipsoidTerrainProvider(),
      requestRenderMode: true,
      maximumRenderTimeChange: Number.POSITIVE_INFINITY,
    });

    viewer.scene.globe.baseColor = Color.fromCssColorString("#15211d");
    viewer.scene.backgroundColor = Color.fromCssColorString("#101312");
    viewer.camera.setView({
      destination: sunolCameraDestination,
      orientation: {
        heading: 0,
        pitch: -1.18,
        roll: 0,
      },
    });

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

  return <div className="cesium-map" ref={containerRef} role="application" aria-label="Cesium mission map" />;
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
  const token = import.meta.env.VITE_CESIUM_ION_TOKEN?.trim();
  if (!token) return undefined;
  Ion.defaultAccessToken = token;
  return token;
}

function createBaseLayer(ionToken: string | undefined): ImageryLayer {
  if (ionToken) {
    return ImageryLayer.fromWorldImagery({});
  }

  return new ImageryLayer(
    new OpenStreetMapImageryProvider({
      url: "https://tile.openstreetmap.org/",
      credit: "OpenStreetMap contributors",
    }),
  );
}
