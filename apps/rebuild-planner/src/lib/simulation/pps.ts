/*
Module Context
Purpose:
- Interpret simulated PPS events for launch-package decision points.
Why This Exists:
- The rebuild PRD supersedes the older Route A/B preview grammar with a Launch Package Simulation grammar.
Primary Inputs/Outputs:
- Inputs: PPS rate, active decision point, selected target zone, and aim location.
- Outputs: Accepted simulation action or rejection reason for audit logging.
Research / Source Links:
- docs/PALANTIR_REBUILD_MASTER_PRD.md
- docs/research/formula_registry.json
Validated:
- tested: apps/rebuild-planner/tests/pps.test.ts.
Current Limits / TODO:
- Target zone geometry is circle-only for MVP.
Agent Maintenance Rule:
- Update the formula registry before changing PPS interpretation.
*/

import type { DecisionTargetZoneRecord } from "@/lib/types";

export const PPS_BRANCH_RULE_ID = "demo_launch_package_pps_branch_mapping_v2";

export type PpsRate = 1 | 2 | 4 | 8;
export type PpsAction = "hold" | "rtb" | "primary" | "alternate";
export type PpsRejectReason = "unsupported_pps" | "no_active_decision" | "no_target_zone" | "zone_mismatch" | "outside_zone" | "pps_not_allowed";

export type PpsEvaluationInput = {
  observedPps: number;
  activeDecisionPointId: string | null;
  selectedTargetZone: DecisionTargetZoneRecord | null;
  aimLon: number;
  aimLat: number;
};

export type PpsEvaluationResult =
  | {
      accepted: true;
      pps: PpsRate;
      action: PpsAction;
      ruleId: typeof PPS_BRANCH_RULE_ID;
      message: string;
    }
  | {
      accepted: false;
      reason: PpsRejectReason;
      ruleId: typeof PPS_BRANCH_RULE_ID;
      message: string;
    };

const ppsToAction: Record<PpsRate, PpsAction> = {
  1: "hold",
  2: "rtb",
  4: "primary",
  8: "alternate",
};

export function evaluatePpsEvent(input: PpsEvaluationInput): PpsEvaluationResult {
  if (!isSupportedPps(input.observedPps)) {
    return reject("unsupported_pps", `Unsupported PPS ${input.observedPps}. Use 1, 2, 4, or 8.`);
  }

  if (!input.activeDecisionPointId) {
    return reject("no_active_decision", "PPS ignored because simulation is not paused at a decision point.");
  }

  if (!input.selectedTargetZone) {
    return reject("no_target_zone", "PPS ignored because no decision target zone is selected.");
  }

  if (input.selectedTargetZone.decisionPointId !== input.activeDecisionPointId) {
    return reject("zone_mismatch", "PPS ignored because the selected zone is not attached to the active decision point.");
  }

  if (!input.selectedTargetZone.allowedPps.includes(input.observedPps)) {
    return reject("pps_not_allowed", `PPS ${input.observedPps} is not allowed for the selected decision target zone.`);
  }

  if (!pointInCircleMeters(input.aimLon, input.aimLat, input.selectedTargetZone.centerLon, input.selectedTargetZone.centerLat, input.selectedTargetZone.radiusM)) {
    return reject("outside_zone", "PPS ignored because the simulated aim point is outside the selected target zone.");
  }

  const pps = input.observedPps;
  const action = ppsToAction[pps];
  return {
    accepted: true,
    pps,
    action,
    ruleId: PPS_BRANCH_RULE_ID,
    message: `${pps} PPS accepted: ${actionLabel(action)} selected.`,
  };
}

export function pointInCircleMeters(lon: number, lat: number, centerLon: number, centerLat: number, radiusM: number): boolean {
  return haversineMeters(lon, lat, centerLon, centerLat) <= radiusM;
}

export function isSupportedPps(value: number): value is PpsRate {
  return value === 1 || value === 2 || value === 4 || value === 8;
}

export function actionLabel(action: PpsAction): string {
  if (action === "hold") return "hold/loiter";
  if (action === "rtb") return "RTB";
  if (action === "primary") return "primary route";
  return "alternate route";
}

function reject(reason: PpsRejectReason, message: string): PpsEvaluationResult {
  return {
    accepted: false,
    reason,
    ruleId: PPS_BRANCH_RULE_ID,
    message,
  };
}

function haversineMeters(lonA: number, latA: number, lonB: number, latB: number): number {
  const radiusMeters = 6_371_000;
  const phiA = toRadians(latA);
  const phiB = toRadians(latB);
  const deltaPhi = toRadians(latB - latA);
  const deltaLambda = toRadians(lonB - lonA);
  const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phiA) * Math.cos(phiB) * Math.sin(deltaLambda / 2) ** 2;
  return 2 * radiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
