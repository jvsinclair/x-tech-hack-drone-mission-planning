import { describe, expect, it } from "vitest";
import { createEditablePlanState, createRunMissionSnapshot, demoTimelineBeats, jumpRunSnapshot } from "./missionRun";
import { createPlaceholderMissionData } from "./placeholderMission";

describe("missionRun", () => {
  it("creates an editable plan summary from mission data", () => {
    const plan = createEditablePlanState(createPlaceholderMissionData(), new Date("2026-05-03T03:00:00Z"));

    expect(plan.missionName).toBe("Sunol Ridge Training Area");
    expect(plan.outline).toContain("PPS cue and route preview");
    expect(plan.layerSummary.length).toBeGreaterThan(0);
    expect(plan.lastCompiledAt).toBe("2026-05-03T03:00:00.000Z");
  });

  it("uses the requested launch coordinate in placeholder mission data", () => {
    const mission = createPlaceholderMissionData();
    const droneLayer = mission.layers.find((layer) => layer.id === "droneBranches");
    const launch = droneLayer?.geojson.features.find((feature) => feature.id === "wp_launch");

    expect(launch?.geometry?.coordinates).toEqual([-121.832739, 37.504646]);
  });

  it("creates an immutable run snapshot copy of the plan", () => {
    const plan = createEditablePlanState(createPlaceholderMissionData(), new Date("2026-05-03T03:00:00Z"));
    const snapshot = createRunMissionSnapshot(plan, new Date("2026-05-03T03:01:00Z"));
    plan.outline.push("late edit");

    expect(snapshot.currentBeatId).toBe(demoTimelineBeats[0].id);
    expect(snapshot.log[0].label).toBe("Snapshot");
    expect(snapshot.plan.outline).not.toContain("late edit");
  });

  it("logs named time jumps", () => {
    const plan = createEditablePlanState(createPlaceholderMissionData());
    const snapshot = createRunMissionSnapshot(plan, new Date("2026-05-03T03:01:00Z"));
    const jumped = jumpRunSnapshot(snapshot, "pps-cue", new Date("2026-05-03T03:02:00Z"));

    expect(jumped.currentBeatId).toBe("pps-cue");
    expect(jumped.log[0].label).toBe("PPS Cue");
    expect(jumped.log).toHaveLength(2);
  });
});
