/*
Module Context
Purpose:
- Compose the ISR mission planner shell.
Why This Exists:
- Goal 0002 needs the first usable planner surface: map, layers, selected object, and status.
Primary Inputs/Outputs:
- Inputs: MissionData from Foundry or static bundle provider, layer toggle state, Cesium selection events.
- Outputs: Operator-style React UI for Sunol ISR route planning.
Research / Source Links:
- docs/PROJECT_CONTEXT.md
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md
Validated:
- provisional: Shell render is covered by tests; map rendering is verified by build/dev server.
Current Limits / TODO:
- Plan/run mission mode and cue preview interactions are deferred to goals 0003 and 0005.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import { useEffect, useMemo, useState } from "react";
import { CesiumMissionMap } from "./components/CesiumMissionMap";
import { LayerPanel } from "./components/LayerPanel";
import { SelectedObjectPanel } from "./components/SelectedObjectPanel";
import { StatusBar } from "./components/StatusBar";
import { defaultEnabledLayerIds } from "./data/layerCatalog";
import { loadMissionData } from "./data/loadMissionData";
import type { LayerId, MissionData, MissionProviderId, SelectedMissionObject } from "./data/missionTypes";

const initialLayerState: Record<LayerId, boolean> = {
  aoi: defaultEnabledLayerIds.has("aoi"),
  power: defaultEnabledLayerIds.has("power"),
  roads: defaultEnabledLayerIds.has("roads"),
  buildings: defaultEnabledLayerIds.has("buildings"),
  terrain: defaultEnabledLayerIds.has("terrain"),
  unitRoute: defaultEnabledLayerIds.has("unitRoute"),
  droneBranches: defaultEnabledLayerIds.has("droneBranches"),
  cueZones: defaultEnabledLayerIds.has("cueZones"),
  noGoZones: defaultEnabledLayerIds.has("noGoZones"),
};

export default function App() {
  const [preferredProvider, setPreferredProvider] = useState<MissionProviderId>("auto");
  const [missionData, setMissionData] = useState<MissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [enabledLayers, setEnabledLayers] = useState<Record<LayerId, boolean>>(initialLayerState);
  const [selectedObject, setSelectedObject] = useState<SelectedMissionObject | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setLoadError(null);

    loadMissionData({ preferredProvider })
      .then((data) => {
        if (!isMounted) return;
        setMissionData(data);
        setEnabledLayers((current) => {
          const next = { ...current };
          for (const layer of data.layers) {
            if (!(layer.id in next)) next[layer.id] = layer.defaultEnabled;
          }
          return next;
        });
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setLoadError(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [preferredProvider]);

  const enabledLayerIds = useMemo(
    () => new Set(Object.entries(enabledLayers).filter(([, enabled]) => enabled).map(([layerId]) => layerId as LayerId)),
    [enabledLayers],
  );

  function toggleLayer(layerId: LayerId) {
    setEnabledLayers((current) => ({ ...current, [layerId]: !current[layerId] }));
  }

  return (
    <main className="planner-shell">
      <section className="mission-map-pane" aria-label="Mission map">
        <div className="mission-toolbar">
          <div>
            <p className="eyebrow">Sunol Ridge Training Area</p>
            <h1>ISR Mission Planner</h1>
          </div>
          <div className="provider-switch" aria-label="Data provider">
            {(["auto", "foundry", "static"] as MissionProviderId[]).map((provider) => (
              <button
                className={preferredProvider === provider ? "is-active" : ""}
                key={provider}
                onClick={() => setPreferredProvider(provider)}
                type="button"
              >
                {provider}
              </button>
            ))}
          </div>
        </div>
        <CesiumMissionMap
          enabledLayerIds={enabledLayerIds}
          layers={missionData?.layers || []}
          onSelectObject={setSelectedObject}
        />
        <StatusBar
          enabledCount={enabledLayerIds.size}
          isLoading={isLoading}
          loadError={loadError}
          missionData={missionData}
        />
      </section>
      <aside className="planner-side-panel" aria-label="Mission controls">
        <LayerPanel
          enabledLayers={enabledLayers}
          layers={missionData?.layers || []}
          onToggleLayer={toggleLayer}
        />
        <SelectedObjectPanel selectedObject={selectedObject} />
      </aside>
    </main>
  );
}
