/*
Module Context
Purpose:
- Display the currently selected mission object.
Why This Exists:
- The operator shell needs a compact inspection surface for map entities, provenance, and cue/branch preview fields without leaving the planner.
Primary Inputs/Outputs:
- Inputs: SelectedMissionObject from Cesium selection events and editing lock state.
- Outputs: Human-readable object id, layer, name, coordinates, provenance, properties, and future-edit readiness.
Research / Source Links:
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/goals/0004-mgrs-latlon-coordinate-display.md
- docs/goals/0005-pps-cue-zones-and-route-preview.md
- docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md
Validated:
- provisional: Rendered through App shell tests.
Current Limits / TODO:
- Actual waypoint and route editing actions are deferred to later goals.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import type { SelectedMissionObject } from "../data/missionTypes";
import { formatCoordinatePair } from "../data/coordinateFormat";
import { commandPreviewFromProperties, propertyString } from "../data/missionGeojson";
import { formatPpsCueCommand } from "../data/ppsCuePreview";

interface SelectedObjectPanelProps {
  selectedObject: SelectedMissionObject | null;
  editingLocked: boolean;
}

export function SelectedObjectPanel({ selectedObject, editingLocked }: SelectedObjectPanelProps) {
  const properties = Object.entries(selectedObject?.properties || {}).filter(([key]) => !hiddenPropertyKeys.has(key)).slice(0, 8);
  const coordinateDisplay = selectedObject?.coordinate ? formatCoordinatePair(selectedObject.coordinate) : null;
  const sourceName = propertyString(selectedObject?.properties, "sourceName", "source_name");
  const sourceUrl = propertyString(selectedObject?.properties, "sourceUrl", "source_url");
  const retrievedAt = propertyString(selectedObject?.properties, "retrievedAt", "retrieved_at");
  const commandPreview = commandPreviewFromProperties(selectedObject?.properties);
  const isProvisional = selectedObject?.properties.provisional === true || selectedObject?.properties.provisional === "true";

  return (
    <section className="panel-section object-panel">
      <div className="panel-heading">
        <p className="eyebrow">Selection</p>
        <span>{editingLocked ? "locked" : selectedObject ? selectedObject.layerLabel : "none"}</span>
      </div>
      <p className={`edit-lock-note ${editingLocked ? "is-locked" : ""}`}>
        {editingLocked
          ? "Run snapshot active. Direct mission edits are locked during rehearsal."
          : "Plan edits enabled for future waypoint, segment, and cue-zone controls."}
      </p>
      {selectedObject ? (
        <>
          <h2>{selectedObject.name}</h2>
          <p className="object-id">{selectedObject.objectId}</p>
          <div className="object-badges">
            {isProvisional ? <span>provisional</span> : null}
            {commandPreview ? <span>{formatPpsCueCommand(commandPreview)}</span> : null}
          </div>
          <dl className="property-list">
            {coordinateDisplay ? (
              <>
                <div>
                  <dt>lat/lon</dt>
                  <dd>{coordinateDisplay.latLon}</dd>
                </div>
                <div>
                  <dt>mgrs</dt>
                  <dd>{coordinateDisplay.mgrs}</dd>
                </div>
                {coordinateDisplay.elevation ? (
                  <div>
                    <dt>elevation</dt>
                    <dd>{coordinateDisplay.elevation}</dd>
                  </div>
                ) : null}
              </>
            ) : null}
            {sourceName ? (
              <div>
                <dt>source</dt>
                <dd>{sourceUrl ? <a href={sourceUrl} rel="noreferrer" target="_blank">{sourceName}</a> : sourceName}</dd>
              </div>
            ) : null}
            {retrievedAt ? (
              <div>
                <dt>retrieved</dt>
                <dd>{retrievedAt}</dd>
              </div>
            ) : null}
            {properties.map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{formatPropertyValue(value)}</dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <p className="muted">Select a route, cue zone, waypoint, or terrain point on the map.</p>
      )}
    </section>
  );
}

const hiddenPropertyKeys = new Set([
  "planner_layer_id",
  "planner_layer_label",
  "sourceName",
  "source_name",
  "sourceUrl",
  "source_url",
  "retrievedAt",
  "retrieved_at",
]);

function formatPropertyValue(value: unknown): string {
  if (value === null || value === undefined) return "none";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
