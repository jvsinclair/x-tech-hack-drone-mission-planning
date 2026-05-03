/*
Module Context
Purpose:
- Compose the ISR mission planner shell.
Why This Exists:
- Goals 0002, 0003, and 0005 need the usable planner surface, explicit Plan/Run modes, and cue-driven route previews.
Primary Inputs/Outputs:
- Inputs: MissionData from Foundry or static bundle provider, layer toggle state, mode state, PPS cue preview events, Cesium selection and cursor events.
- Outputs: Operator-style React UI for Sunol ISR route planning, coordinate readouts, local cue previews, and app-side run rehearsal.
Research / Source Links:
- docs/PROJECT_CONTEXT.md
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/goals/0003-plan-mode-run-mission-mode.md
- docs/goals/0005-pps-cue-zones-and-route-preview.md
- docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md
Validated:
- provisional: Shell render is covered by tests; map rendering is verified by build/dev server.
Current Limits / TODO:
- Cue preview interactions are local and read-only; backend writeback remains out of scope until a writeback function is published.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import { useEffect, useMemo, useState } from "react";
import { CesiumMissionMap } from "./components/CesiumMissionMap";
import { LayerPanel } from "./components/LayerPanel";
import { MissionModePanel } from "./components/MissionModePanel";
import { ModeSwitch } from "./components/ModeSwitch";
import { SelectedObjectPanel } from "./components/SelectedObjectPanel";
import { SourcesPanel } from "./components/SourcesPanel";
import { StatusBar } from "./components/StatusBar";
import { buildCueDecisionContext } from "./data/cuePreviewContext";
import { defaultEnabledLayerIds } from "./data/layerCatalog";
import { loadMissionData } from "./data/loadMissionData";
import {
  activeTimelineBeat,
  confirmCuePreview,
  createEditablePlanState,
  createRunMissionSnapshot,
  jumpRunSnapshot,
  logCuePreview,
  type PlannerMode,
  type RunMissionSnapshot,
} from "./data/missionRun";
import { interpretPpsCueObservation, type PpsCuePreviewResult } from "./data/ppsCuePreview";
import type { LayerId, MissionData, MissionProviderId, SelectedMissionObject } from "./data/missionTypes";
import type { Wgs84DisplayCoordinate } from "./data/coordinateFormat";

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

interface CueDecisionState {
  preview: PpsCuePreviewResult;
  confirmedAt?: string;
}

export default function App() {
  const [preferredProvider, setPreferredProvider] = useState<MissionProviderId>("auto");
  const [missionData, setMissionData] = useState<MissionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [enabledLayers, setEnabledLayers] = useState<Record<LayerId, boolean>>(initialLayerState);
  const [selectedObject, setSelectedObject] = useState<SelectedMissionObject | null>(null);
  const [cursorCoordinate, setCursorCoordinate] = useState<Wgs84DisplayCoordinate | null>(null);
  const [mode, setMode] = useState<PlannerMode>("plan");
  const [runSnapshot, setRunSnapshot] = useState<RunMissionSnapshot | null>(null);
  const [cueDecision, setCueDecision] = useState<CueDecisionState | null>(null);

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
  const planState = useMemo(() => createEditablePlanState(missionData), [missionData]);
  const activeBeat = useMemo(() => activeTimelineBeat(runSnapshot), [runSnapshot]);
  const cueDecisionContext = useMemo(
    () => buildCueDecisionContext(missionData, cueDecision?.preview || null),
    [cueDecision?.preview, missionData],
  );

  function toggleLayer(layerId: LayerId) {
    setEnabledLayers((current) => ({ ...current, [layerId]: !current[layerId] }));
  }

  function changeMode(nextMode: PlannerMode) {
    setMode(nextMode);
    if (nextMode === "run" && !runSnapshot) {
      setRunSnapshot(createRunMissionSnapshot(planState));
    }
  }

  function startRunSnapshot() {
    setRunSnapshot(createRunMissionSnapshot(planState));
    setMode("run");
  }

  function jumpToBeat(beatId: string) {
    setRunSnapshot((current) => jumpRunSnapshot(current || createRunMissionSnapshot(planState), beatId));
    setMode("run");
  }

  function simulateCue(observedPulseRatePps: number | null) {
    const preview = interpretPpsCueObservation({
      observedPulseRatePps,
      missionState: activeBeat.state,
      sourceRef: "local_ui_simulated_pps",
    });
    setCueDecision({ preview });
    setRunSnapshot((current) => logCuePreview(current || createRunMissionSnapshot(planState), preview));
    setMode("run");
  }

  function confirmActiveCuePreview() {
    if (!cueDecision?.preview || cueDecision.preview.status !== "passed" || !cueDecision.preview.requiresConfirmation) return;
    const confirmedAt = new Date().toISOString();
    setCueDecision({ ...cueDecision, confirmedAt });
    setRunSnapshot((current) => confirmCuePreview(current || createRunMissionSnapshot(planState), cueDecision.preview, new Date(confirmedAt)));
    setMode("run");
  }

  function clearCuePreview() {
    setCueDecision(null);
  }

  return (
    <main className="planner-shell">
      <section className="mission-map-pane" aria-label="Mission map">
        <div className="mission-toolbar">
          <div>
            <p className="eyebrow">Sunol Ridge Training Area</p>
            <h1>ISR Mission Planner</h1>
          </div>
          <div className="toolbar-controls">
            <ModeSwitch mode={mode} onModeChange={changeMode} />
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
        </div>
        <CesiumMissionMap
          activeCommandPreview={cueDecision?.preview.status === "passed" ? cueDecision.preview.matchedCommand : undefined}
          enabledLayerIds={enabledLayerIds}
          layers={missionData?.layers || []}
          onPointerCoordinate={setCursorCoordinate}
          onSelectObject={setSelectedObject}
        />
        <StatusBar
          cursorCoordinate={cursorCoordinate}
          enabledCount={enabledLayerIds.size}
          isLoading={isLoading}
          loadError={loadError}
          missionData={missionData}
          mode={mode}
        />
      </section>
      <aside className="planner-side-panel" aria-label="Mission controls">
        <MissionModePanel
          activeBeat={activeBeat}
          cueDecision={cueDecision}
          cueDecisionContext={cueDecisionContext}
          mode={mode}
          onClearCuePreview={clearCuePreview}
          onConfirmCuePreview={confirmActiveCuePreview}
          onJumpToBeat={jumpToBeat}
          onSimulateCue={simulateCue}
          onStartRun={startRunSnapshot}
          planState={planState}
          runSnapshot={runSnapshot}
        />
        <LayerPanel
          enabledLayers={enabledLayers}
          layers={missionData?.layers || []}
          onToggleLayer={toggleLayer}
        />
        <SourcesPanel missionData={missionData} />
        <SelectedObjectPanel editingLocked={mode === "run"} selectedObject={selectedObject} />
      </aside>
    </main>
  );
}
