/*
Module Context
Purpose:
- Display mission safety scope and source manifest entries.
Why This Exists:
- The Foundry backend and static bundle both carry provenance that operators must see before treating layers as planning context.
Primary Inputs/Outputs:
- Inputs: MissionData safetyScope and source entries.
- Outputs: Compact safety-scope badges and clickable source manifest list.
Research / Source Links:
- docs/PROJECT_CONTEXT.md
- docs/FOUNDRY_HOSTED_APP_SETUP.md
- docs/goals/0005-pps-cue-zones-and-route-preview.md
Validated:
- provisional: Rendered through the App shell tests.
Current Limits / TODO:
- This is a read-only manifest view; source freshness validation remains in the bundle validator and Foundry pipeline.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import type { MissionData } from "../data/missionTypes";

interface SourcesPanelProps {
  missionData: MissionData | null;
}

export function SourcesPanel({ missionData }: SourcesPanelProps) {
  const sources = missionData?.sources || [];
  const safetyScope = missionData?.safetyScope || [];

  return (
    <section className="panel-section sources-panel">
      <div className="panel-heading">
        <p className="eyebrow">Sources</p>
        <span>{sources.length}</span>
      </div>
      {safetyScope.length > 0 ? (
        <div className="safety-scope">
          {safetyScope.slice(0, 3).map((scope) => (
            <p key={scope}>{scope}</p>
          ))}
        </div>
      ) : null}
      {sources.length === 0 ? (
        <p className="muted">Source manifest unavailable for this provider.</p>
      ) : (
        <div className="source-list">
          {sources.map((source, index) => (
            <article key={`${source.layerId || source.sourceName}-${index}`}>
              <strong>
                {source.sourceUrl ? (
                  <a href={source.sourceUrl} rel="noreferrer" target="_blank">
                    {source.sourceName}
                  </a>
                ) : (
                  source.sourceName
                )}
              </strong>
              <p>{source.layerId || "bundle"}{source.count !== undefined ? ` | ${source.count} rows` : ""}</p>
              <small>{source.retrievedAt || "retrieval time unavailable"}</small>
              {source.provisional ? <span>provisional</span> : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
