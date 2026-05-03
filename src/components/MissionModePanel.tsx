/*
Module Context
Purpose:
- Display Plan Mode and Run Mission Mode state, timeline jumps, and run log.
Why This Exists:
- Goals 0003 and 0005 need a visible rehearsal workflow, cue preview decision panel, and local operator log while preserving non-operational safety scope.
Primary Inputs/Outputs:
- Inputs: PlannerMode, editable plan summary, optional run snapshot, active beat, cue preview state, and callbacks.
- Outputs: Plan summary, run snapshot controls, named time jumps, cue decision panel, and log shell.
Research / Source Links:
- docs/goals/0003-plan-mode-run-mission-mode.md
- docs/goals/0005-pps-cue-zones-and-route-preview.md
- docs/STATE_DECISION_GRAPH.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Exercised by App mode tests and missionRun unit tests.
Current Limits / TODO:
- Real state-machine execution and backend writeback are out of scope; confirmations produce local run-log entries only.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import { demoTimelineBeats, type DemoTimelineBeat, type EditablePlanState, type PlannerMode, type RunMissionSnapshot } from "../data/missionRun";
import { formatCoordinatePair } from "../data/coordinateFormat";
import type { CueDecisionContext } from "../data/cuePreviewContext";
import { formatPpsCueCommand, supportedPpsCueRates, type PpsCuePreviewResult } from "../data/ppsCuePreview";

interface CueDecisionState {
  preview: PpsCuePreviewResult;
  confirmedAt?: string;
}

interface MissionModePanelProps {
  mode: PlannerMode;
  planState: EditablePlanState;
  runSnapshot: RunMissionSnapshot | null;
  activeBeat: DemoTimelineBeat;
  cueDecision: CueDecisionState | null;
  cueDecisionContext: CueDecisionContext;
  onStartRun: () => void;
  onJumpToBeat: (beatId: string) => void;
  onSimulateCue: (observedPulseRatePps: number | null) => void;
  onConfirmCuePreview: () => void;
  onClearCuePreview: () => void;
}

export function MissionModePanel({
  mode,
  planState,
  runSnapshot,
  activeBeat,
  cueDecision,
  cueDecisionContext,
  onStartRun,
  onJumpToBeat,
  onSimulateCue,
  onConfirmCuePreview,
  onClearCuePreview,
}: MissionModePanelProps) {
  const isRunMode = mode === "run";
  const cueCoordinateDisplay = cueDecisionContext.coordinate ? formatCoordinatePair(cueDecisionContext.coordinate) : null;

  return (
    <section className="panel-section mission-mode-panel">
      <div className="panel-heading">
        <p className="eyebrow">{isRunMode ? "Run Mission" : "Plan Mission"}</p>
        <span>{isRunMode ? "simulation" : "editable"}</span>
      </div>

      <div className="mode-copy">
        <h2>{isRunMode ? "Run rehearsal snapshot" : "Editable plan state"}</h2>
        <p>
          {isRunMode
            ? "App-side simulation/rehearsal only. This does not control a drone or send hardware commands."
            : "Planning controls are enabled. Future waypoint, segment, and cue-zone edits recompile this outline."}
        </p>
      </div>

      <dl className="plan-metrics">
        <div>
          <dt>Distance</dt>
          <dd>{planState.routeDistanceKm.toFixed(1)} km</dd>
        </div>
        <div>
          <dt>Warnings</dt>
          <dd>{planState.warningCount}</dd>
        </div>
        <div>
          <dt>Provider</dt>
          <dd>{planState.provider}</dd>
        </div>
      </dl>

      <div className="outline-list" aria-label="State-machine outline">
        {planState.outline.map((step, index) => (
          <div className="outline-item" key={step}>
            <span>{index + 1}</span>
            <p>{step}</p>
          </div>
        ))}
      </div>

      {isRunMode ? (
        <div className="run-controls">
          <button className="primary-action" onClick={onStartRun} type="button">
            {runSnapshot ? "Refresh Snapshot" : "Create Run Snapshot"}
          </button>
          {runSnapshot ? (
            <>
              <div className="active-beat">
                <p className="eyebrow">Current Beat</p>
                <h3>{activeBeat.label}</h3>
                <p>{activeBeat.description}</p>
              </div>
              <div className="timeline-jumps" aria-label="Named time jumps">
                {demoTimelineBeats.map((beat) => (
                  <button
                    className={activeBeat.id === beat.id ? "is-active" : ""}
                    key={beat.id}
                    onClick={() => onJumpToBeat(beat.id)}
                    type="button"
                  >
                    {beat.label}
                  </button>
                ))}
              </div>
              <div className="cue-decision-panel" aria-label="PPS cue decision panel">
                <div className="cue-trigger-row" aria-label="Simulated PPS cues">
                  {supportedPpsCueRates.map((pps) => (
                    <button key={pps} onClick={() => onSimulateCue(pps)} type="button">
                      {pps} PPS
                    </button>
                  ))}
                  <button onClick={() => onSimulateCue(null)} type="button">
                    No pulse
                  </button>
                </div>
                {cueDecision ? (
                  <div className={`cue-preview-card cue-preview-${cueDecision.preview.status}`}>
                    <div className="cue-preview-heading">
                      <span>{cueDecision.preview.status}</span>
                      <strong>{cueDecision.preview.matchedCommandLabel}</strong>
                    </div>
                    <dl className="cue-preview-fields">
                      <div>
                        <dt>map zone</dt>
                        <dd>{cueDecisionContext.cueZoneName || "No mapped cue zone"}</dd>
                      </div>
                      <div>
                        <dt>pps</dt>
                        <dd>{cueDecisionContext.ppsLabel || formatObservedPps(cueDecision.preview)}</dd>
                      </div>
                      <div>
                        <dt>matched command</dt>
                        <dd>{formatPpsCueCommand(cueDecision.preview.matchedCommand)}</dd>
                      </div>
                      <div>
                        <dt>route preview</dt>
                        <dd>{cueDecisionContext.routePreviewName || "No branch geometry"}</dd>
                      </div>
                      {cueCoordinateDisplay ? (
                        <>
                          <div>
                            <dt>lat/lon</dt>
                            <dd>{cueCoordinateDisplay.latLon}</dd>
                          </div>
                          <div>
                            <dt>mgrs</dt>
                            <dd>{cueCoordinateDisplay.mgrs}</dd>
                          </div>
                        </>
                      ) : null}
                    </dl>
                    <p>{cueDecision.preview.rationale}</p>
                    {cueDecision.preview.warnings.length > 0 ? (
                      <ul className="cue-warning-list">
                        {cueDecision.preview.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    ) : null}
                    <div className="cue-action-row">
                      <button
                        className="primary-action"
                        disabled={
                          cueDecision.preview.status !== "passed" ||
                          !cueDecision.preview.requiresConfirmation ||
                          Boolean(cueDecision.confirmedAt)
                        }
                        onClick={onConfirmCuePreview}
                        type="button"
                      >
                        {cueDecision.confirmedAt ? "Confirmed" : "Confirm Preview"}
                      </button>
                      <button onClick={onClearCuePreview} type="button">
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="muted">No cue preview selected.</p>
                )}
              </div>
              <div className="run-log" aria-label="Run log">
                {runSnapshot.log.slice(0, 6).map((entry) => (
                  <article key={entry.id}>
                    <strong>{entry.label}</strong>
                    <p>{entry.message}</p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="muted">Create a run snapshot to lock the current plan and reveal time jumps.</p>
          )}
        </div>
      ) : (
        <p className="edit-state">Editing unlocked for waypoint, route, cue-zone, and layer planning surfaces.</p>
      )}
    </section>
  );
}

function formatObservedPps(preview: PpsCuePreviewResult): string {
  return preview.observedPulseRatePps === null ? "No pulse" : `${preview.observedPulseRatePps} PPS`;
}
