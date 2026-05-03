/*
Module Context
Purpose:
- Render the global Plan Mission / Run Mission switch.
Why This Exists:
- Goal 0003 requires an explicit mode control that separates editable planning from app-side run rehearsal.
Primary Inputs/Outputs:
- Inputs: Current PlannerMode and mode-change callback.
- Outputs: Segmented mode buttons with accessible pressed state.
Research / Source Links:
- docs/goals/0003-plan-mode-run-mission-mode.md
- docs/ICONOGRAPHY_AND_CONTROLS_RESOLUTIONS.md
Validated:
- provisional: Exercised by App mode tests.
Current Limits / TODO:
- Keyboard shortcuts and richer mode affordances are deferred.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import type { PlannerMode } from "../data/missionRun";

interface ModeSwitchProps {
  mode: PlannerMode;
  onModeChange: (mode: PlannerMode) => void;
}

export function ModeSwitch({ mode, onModeChange }: ModeSwitchProps) {
  return (
    <div className="mode-switch" aria-label="Mission mode">
      <button
        aria-pressed={mode === "plan"}
        className={mode === "plan" ? "is-active" : ""}
        onClick={() => onModeChange("plan")}
        type="button"
      >
        Plan Mission
      </button>
      <button
        aria-pressed={mode === "run"}
        className={mode === "run" ? "is-active" : ""}
        onClick={() => onModeChange("run")}
        type="button"
      >
        Run Mission
      </button>
    </div>
  );
}
