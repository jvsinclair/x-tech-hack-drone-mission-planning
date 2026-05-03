/*
Module Context
Purpose:
- Display the currently selected mission object.
Why This Exists:
- The operator shell needs a compact inspection surface for map entities without leaving the planner.
Primary Inputs/Outputs:
- Inputs: SelectedMissionObject from Cesium selection events and editing lock state.
- Outputs: Human-readable object id, layer, name, coordinates, properties, and future-edit readiness.
Research / Source Links:
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/goals/0004-mgrs-latlon-coordinate-display.md
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

interface SelectedObjectPanelProps {
  selectedObject: SelectedMissionObject | null;
  editingLocked: boolean;
}

export function SelectedObjectPanel({ selectedObject, editingLocked }: SelectedObjectPanelProps) {
  const properties = Object.entries(selectedObject?.properties || {}).slice(0, 8);
  const coordinateDisplay = selectedObject?.coordinate ? formatCoordinatePair(selectedObject.coordinate) : null;

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

function formatPropertyValue(value: unknown): string {
  if (value === null || value === undefined) return "none";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
