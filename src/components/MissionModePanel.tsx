/*
Module Context
Purpose:
- Display Plan Mode and Run Mission Mode state, timeline jumps, and run log.
Why This Exists:
- Goal 0003 needs a visible rehearsal workflow for judge demo beats while preserving non-operational safety scope.
Primary Inputs/Outputs:
- Inputs: PlannerMode, editable plan summary, optional run snapshot, active beat, and callbacks.
- Outputs: Plan summary, run snapshot controls, named time jumps, and log shell.
Research / Source Links:
- docs/goals/0003-plan-mode-run-mission-mode.md
- docs/STATE_DECISION_GRAPH.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Exercised by App mode tests and missionRun unit tests.
Current Limits / TODO:
- Real state-machine execution, PPS interpretation, and operator confirmations are deferred to later goals.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import { demoTimelineBeats, type DemoTimelineBeat, type EditablePlanState, type PlannerMode, type RunMissionSnapshot } from "../data/missionRun";

interface MissionModePanelProps {
  mode: PlannerMode;
  planState: EditablePlanState;
  runSnapshot: RunMissionSnapshot | null;
  activeBeat: DemoTimelineBeat;
  onStartRun: () => void;
  onJumpToBeat: (beatId: string) => void;
}

export function MissionModePanel({ mode, planState, runSnapshot, activeBeat, onStartRun, onJumpToBeat }: MissionModePanelProps) {
  const isRunMode = mode === "run";

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
