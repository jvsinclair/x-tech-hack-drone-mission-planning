/*
Module Context
Purpose:
- Render planner layer toggles and counts.
Why This Exists:
- Operators need fast control over AOI, terrain, infrastructure, route, and cue overlays.
Primary Inputs/Outputs:
- Inputs: MissionLayer list and enabled layer state.
- Outputs: Checkbox controls that update map visibility.
Research / Source Links:
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
- docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md
Validated:
- provisional: Rendered through App shell tests.
Current Limits / TODO:
- Detailed symbology legend lands in goal 0006.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import type { CSSProperties } from "react";
import type { LayerId, MissionLayer } from "../data/missionTypes";

interface LayerPanelProps {
  layers: MissionLayer[];
  enabledLayers: Record<LayerId, boolean>;
  onToggleLayer: (layerId: LayerId) => void;
}

export function LayerPanel({ layers, enabledLayers, onToggleLayer }: LayerPanelProps) {
  return (
    <section className="panel-section">
      <div className="panel-heading">
        <p className="eyebrow">Layers</p>
        <span>{layers.length}</span>
      </div>
      <div className="layer-list">
        {layers.length === 0 ? (
          <p className="muted">Loading layer catalog.</p>
        ) : (
          layers.map((layer) => (
            <label className="layer-toggle" key={layer.id}>
              <input
                checked={Boolean(enabledLayers[layer.id])}
                onChange={() => onToggleLayer(layer.id)}
                type="checkbox"
              />
              <span className="layer-swatch" style={{ "--layer-color": layer.style.stroke } as CSSProperties} />
              <span className="layer-copy">
                <span>{layer.label}</span>
                <small>{layer.count} objects</small>
              </span>
              <span className={`layer-status layer-status-${layer.status}`}>{layer.status}</span>
            </label>
          ))
        )}
      </div>
    </section>
  );
}
