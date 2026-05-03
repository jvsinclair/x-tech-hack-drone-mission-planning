/*
Module Context
Purpose:
- Model Plan Mission vs Run Mission rehearsal state for the planner shell.
Why This Exists:
- Goal 0003 needs editable plan state, immutable run snapshots, named demo jumps, and an operator decision log without real drone execution.
Primary Inputs/Outputs:
- Inputs: MissionData, selected timeline beat ids, and simulated cue preview results.
- Outputs: EditablePlanState, RunMissionSnapshot, and RunLogEntry objects used by the UI.
Research / Source Links:
- docs/goals/0003-plan-mode-run-mission-mode.md
- docs/goals/0005-pps-cue-zones-and-route-preview.md
- docs/STATE_DECISION_GRAPH.md
- docs/ROUNDTABLE_DEMO_REQUIREMENTS.md
Validated:
- provisional: Snapshot and timeline helpers are covered by unit tests.
Current Limits / TODO:
- This is an app-side simulation model only; cue previews and confirmations never mutate server-side mission state.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import type { MissionData } from "./missionTypes";
import type { PpsCuePreviewResult } from "./ppsCuePreview";

export type PlannerMode = "plan" | "run";

export interface EditablePlanState {
  planId: string;
  missionName: string;
  provider: MissionData["provider"];
  lastCompiledAt: string;
  routeDistanceKm: number;
  warningCount: number;
  outline: string[];
  layerSummary: PlanLayerSummary[];
}

export interface PlanLayerSummary {
  label: string;
  count: number;
  status: string;
}

export interface DemoTimelineBeat {
  id: string;
  label: string;
  state: string;
  description: string;
}

export interface RunLogEntry {
  id: string;
  at: string;
  beatId: string;
  label: string;
  message: string;
  eventType?: "snapshot" | "timeline_jump" | "cue_event" | "route_preview" | "operator_confirmation" | "warning";
}

export interface RunMissionSnapshot {
  snapshotId: string;
  createdAt: string;
  missionName: string;
  sourceProvider: MissionData["provider"];
  plan: EditablePlanState;
  currentBeatId: string;
  log: RunLogEntry[];
}

export const demoTimelineBeats: DemoTimelineBeat[] = [
  {
    id: "launch",
    label: "Launch",
    state: "launch_check",
    description: "Start rehearsal from the launch waypoint and confirm the route snapshot.",
  },
  {
    id: "route-start",
    label: "Route Start",
    state: "transit_route_start",
    description: "Advance to unit movement and initial drone overwatch.",
  },
  {
    id: "terrain-warning",
    label: "Terrain Warning",
    state: "terrain_attention_review",
    description: "Pause on a terrain attention point or obstacle review marker.",
  },
  {
    id: "target-identification",
    label: "Target Identification",
    state: "observe_unknown_contact",
    description: "Show the human-reviewed identification decision point.",
  },
  {
    id: "pps-cue",
    label: "PPS Cue",
    state: "cue_observed",
    description: "Hold for the simulated optical cue event before route preview.",
  },
  {
    id: "route-branch-preview",
    label: "Route Branch Preview",
    state: "preview_route_branch",
    description: "Preview Route A/B geometry before operator confirmation.",
  },
  {
    id: "rtb",
    label: "RTB",
    state: "return_to_base_preview",
    description: "Preview return-to-base/recovery branch with confirmation required.",
  },
];

export function createEditablePlanState(missionData: MissionData | null, now = new Date()): EditablePlanState {
  const layers = missionData?.layers || [];
  const warningCount = layers.filter((layer) => layer.status !== "ready").length + (missionData?.notices.length || 0);
  const missionName = missionData?.missionName || "Sunol Ridge Training Area";
  return {
    planId: "sunol-route-security-recon",
    missionName,
    provider: missionData?.provider || "placeholder",
    lastCompiledAt: now.toISOString(),
    routeDistanceKm: estimateRouteDistanceKm(missionData),
    warningCount,
    outline: [
      "Launch / comms check",
      "Transit with unit route overwatch",
      "Terrain attention review",
      "Target identification decision",
      "PPS cue and route preview",
      "Route branch confirmation",
      "RTB / land recover",
    ],
    layerSummary: layers.map((layer) => ({
      label: layer.label,
      count: layer.count,
      status: layer.status,
    })),
  };
}

export function createRunMissionSnapshot(plan: EditablePlanState, now = new Date()): RunMissionSnapshot {
  const createdAt = now.toISOString();
  return {
    snapshotId: `run-${createdAt}`,
    createdAt,
    missionName: plan.missionName,
    sourceProvider: plan.provider,
    plan: clonePlan(plan),
    currentBeatId: demoTimelineBeats[0].id,
    log: [
      {
        id: `log-${createdAt}-snapshot`,
        at: createdAt,
        beatId: demoTimelineBeats[0].id,
        label: "Snapshot",
        message: "Created immutable run rehearsal snapshot from the current plan.",
        eventType: "snapshot",
      },
    ],
  };
}

export function jumpRunSnapshot(snapshot: RunMissionSnapshot, beatId: string, now = new Date()): RunMissionSnapshot {
  const beat = demoTimelineBeats.find((candidate) => candidate.id === beatId) || demoTimelineBeats[0];
  const at = now.toISOString();
  return {
    ...snapshot,
    currentBeatId: beat.id,
    log: [
      {
        id: `log-${at}-${beat.id}`,
        at,
        beatId: beat.id,
        label: beat.label,
        message: `Jumped rehearsal timeline to ${beat.label}: ${beat.description}`,
        eventType: "timeline_jump",
      },
      ...snapshot.log,
    ],
  };
}

export function logCuePreview(snapshot: RunMissionSnapshot, preview: PpsCuePreviewResult, now = new Date()): RunMissionSnapshot {
  const at = now.toISOString();
  const isWarning = preview.status !== "passed";
  return {
    ...snapshot,
    log: [
      {
        id: `log-${at}-${preview.id}`,
        at,
        beatId: snapshot.currentBeatId,
        label: isWarning ? "Cue Ignored" : "Cue Preview",
        message: isWarning
          ? `Observed ${formatObservedPps(preview)}. ${preview.rationale}`
          : `Observed ${formatObservedPps(preview)} and previewed ${preview.matchedCommandLabel}. Operator confirmation required before route state advances.`,
        eventType: isWarning ? "warning" : "cue_event",
      },
      ...snapshot.log,
    ],
  };
}

export function confirmCuePreview(snapshot: RunMissionSnapshot, preview: PpsCuePreviewResult, now = new Date()): RunMissionSnapshot {
  const at = now.toISOString();
  const nextBeatId =
    preview.matchedCommand === "preview_return_to_base"
      ? "rtb"
      : preview.matchedCommand === "preview_hold_or_loiter"
        ? "pps-cue"
        : "route-branch-preview";
  return {
    ...snapshot,
    currentBeatId: nextBeatId,
    log: [
      {
        id: `log-${at}-${preview.id}-confirmed`,
        at,
        beatId: nextBeatId,
        label: "Operator Confirmed",
        message: `Operator confirmed ${preview.matchedCommandLabel}. This is a local rehearsal log entry only; no backend action or drone command was sent.`,
        eventType: "operator_confirmation",
      },
      ...snapshot.log,
    ],
  };
}

export function activeTimelineBeat(snapshot: RunMissionSnapshot | null): DemoTimelineBeat {
  return demoTimelineBeats.find((beat) => beat.id === snapshot?.currentBeatId) || demoTimelineBeats[0];
}

function clonePlan(plan: EditablePlanState): EditablePlanState {
  return {
    ...plan,
    outline: [...plan.outline],
    layerSummary: plan.layerSummary.map((layer) => ({ ...layer })),
  };
}

function estimateRouteDistanceKm(missionData: MissionData | null): number {
  const unitRouteCount = missionData?.layers.find((layer) => layer.id === "unitRoute")?.count || 0;
  const branchCount = missionData?.layers.find((layer) => layer.id === "droneBranches")?.count || 0;
  return Number((3.4 + unitRouteCount * 0.8 + branchCount * 0.35).toFixed(1));
}

function formatObservedPps(preview: PpsCuePreviewResult): string {
  return preview.observedPulseRatePps === null ? "no pulse" : `${preview.observedPulseRatePps} PPS`;
}
