/*
Module Context
Purpose:
- Interpret simulated PPS cue observations into human-confirmed command previews.
Why This Exists:
- Goal 0005 needs a pure, testable optical cue interpreter before UI or map layers react to cue input.
Primary Inputs/Outputs:
- Inputs: Simulated pulse-rate observation, mission state/context fields, and optional cue metadata.
- Outputs: Preview result with matched command, rationale, warnings, evidence refs, and confirmation requirement.
Research / Source Links:
- docs/research/pps_drone_command_mapping_plan.md
- docs/research/formula_registry.json
- docs/goals/0005-pps-cue-zones-and-route-preview.md
Validated:
- provisional: Core 1/2/4/8 PPS mapping and unknown-cue rejection are covered by unit tests.
Current Limits / TODO:
- Context gates are intentionally shallow until full mission state validators exist; this module never controls real hardware.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

export type PpsCueCommandPreview =
  | "preview_hold_or_loiter"
  | "preview_route_a"
  | "preview_route_b"
  | "preview_return_to_base";

export type PpsCuePreviewStatus = "passed" | "warning" | "blocked";

export interface PpsCueObservation {
  observedPulseRatePps: number | null;
  observedAt?: string;
  missionState?: string;
  expectedSector?: string;
  observedSector?: string;
  confidence?: number;
  sourceRef?: string;
}

export interface PpsCuePreviewResult {
  id: string;
  status: PpsCuePreviewStatus;
  observedPulseRatePps: number | null;
  observedAt: string;
  matchedCommand?: PpsCueCommandPreview;
  matchedCommandLabel: string;
  requiresConfirmation: boolean;
  rationale: string;
  warnings: string[];
  evidenceRefs: string[];
}

const evidenceRef = "demo_optical_cue_pps_command_mapping_v1";

const commandByPulseRate = new Map<number, PpsCueCommandPreview>([
  [1, "preview_hold_or_loiter"],
  [2, "preview_route_a"],
  [4, "preview_route_b"],
  [8, "preview_return_to_base"],
]);

const commandLabels: Record<PpsCueCommandPreview, string> = {
  preview_hold_or_loiter: "Hold / loiter preview",
  preview_route_a: "Route A preview",
  preview_route_b: "Route B preview",
  preview_return_to_base: "RTB preview",
};

export const supportedPpsCueRates = [1, 2, 4, 8] as const;

export function interpretPpsCueObservation(observation: PpsCueObservation, now = new Date()): PpsCuePreviewResult {
  const observedAt = observation.observedAt || now.toISOString();
  const id = `cue-${observedAt}-${observation.observedPulseRatePps ?? "unknown"}`;
  const warnings: string[] = [];

  if (
    observation.expectedSector &&
    observation.observedSector &&
    observation.expectedSector !== observation.observedSector
  ) {
    return {
      id,
      status: "blocked",
      observedPulseRatePps: observation.observedPulseRatePps,
      observedAt,
      matchedCommandLabel: "No command",
      requiresConfirmation: false,
      rationale: "Cue was observed outside the expected sector. No mission state change is allowed.",
      warnings: [`Expected ${observation.expectedSector}; observed ${observation.observedSector}.`],
      evidenceRefs: [evidenceRef],
    };
  }

  if (observation.observedPulseRatePps === null) {
    return ignoredCue(id, observation.observedPulseRatePps, observedAt, "No pulse was detected. Existing route state remains unchanged.");
  }

  const command = commandByPulseRate.get(observation.observedPulseRatePps);
  if (!command) {
    return ignoredCue(
      id,
      observation.observedPulseRatePps,
      observedAt,
      `${observation.observedPulseRatePps} PPS is not in the approved demo command grammar. Existing route state remains unchanged.`,
    );
  }

  if (observation.confidence === undefined) {
    warnings.push("Cue confidence was not supplied; operator confirmation is required.");
  }

  return {
    id,
    status: "passed",
    observedPulseRatePps: observation.observedPulseRatePps,
    observedAt,
    matchedCommand: command,
    matchedCommandLabel: commandLabels[command],
    requiresConfirmation: true,
    rationale: `${observation.observedPulseRatePps} PPS maps to ${commandLabels[command]} under the provisional demo grammar. This is a preview only until confirmed by the operator.`,
    warnings,
    evidenceRefs: [evidenceRef],
  };
}

export function formatPpsCueCommand(command: PpsCueCommandPreview | string | undefined): string {
  if (!command) return "No command";
  return command in commandLabels ? commandLabels[command as PpsCueCommandPreview] : humanizeCommand(command);
}

function ignoredCue(
  id: string,
  observedPulseRatePps: number | null,
  observedAt: string,
  rationale: string,
): PpsCuePreviewResult {
  return {
    id,
    status: "warning",
    observedPulseRatePps,
    observedAt,
    matchedCommandLabel: "No command",
    requiresConfirmation: false,
    rationale,
    warnings: ["Ignored simulated cue; no route branch, hold, or RTB preview was committed."],
    evidenceRefs: [evidenceRef],
  };
}

function humanizeCommand(command: string): string {
  return command
    .replace(/^preview_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
