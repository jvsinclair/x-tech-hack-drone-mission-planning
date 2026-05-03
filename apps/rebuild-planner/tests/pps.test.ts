import { describe, expect, it } from "vitest";
import { evaluatePpsEvent, pointInCircleMeters, PPS_BRANCH_RULE_ID } from "@/lib/simulation/pps";
import type { DecisionTargetZoneRecord } from "@/lib/types";

const zone: DecisionTargetZoneRecord = {
  id: "zone-1",
  decisionPointId: "decision-1",
  name: "DTZ-1",
  centerLon: -121.842,
  centerLat: 37.538,
  radiusM: 250,
  allowedPps: [1, 2, 4, 8],
};

describe("PPS launch-package grammar", () => {
  it.each([
    [1, "hold"],
    [2, "rtb"],
    [4, "primary"],
    [8, "alternate"],
  ] as const)("maps %i PPS to %s", (observedPps, action) => {
    const result = evaluatePpsEvent({
      observedPps,
      activeDecisionPointId: "decision-1",
      selectedTargetZone: zone,
      aimLon: zone.centerLon,
      aimLat: zone.centerLat,
    });

    expect(result).toMatchObject({
      accepted: true,
      action,
      ruleId: PPS_BRANCH_RULE_ID,
    });
  });

  it("rejects unsupported PPS without changing state", () => {
    const result = evaluatePpsEvent({
      observedPps: 6,
      activeDecisionPointId: "decision-1",
      selectedTargetZone: zone,
      aimLon: zone.centerLon,
      aimLat: zone.centerLat,
    });

    expect(result).toMatchObject({
      accepted: false,
      reason: "unsupported_pps",
    });
  });

  it("rejects when no active decision point is set", () => {
    const result = evaluatePpsEvent({
      observedPps: 4,
      activeDecisionPointId: null,
      selectedTargetZone: zone,
      aimLon: zone.centerLon,
      aimLat: zone.centerLat,
    });

    expect(result).toMatchObject({
      accepted: false,
      reason: "no_active_decision",
    });
  });

  it("rejects when the selected zone belongs to another decision point", () => {
    const result = evaluatePpsEvent({
      observedPps: 4,
      activeDecisionPointId: "decision-2",
      selectedTargetZone: zone,
      aimLon: zone.centerLon,
      aimLat: zone.centerLat,
    });

    expect(result).toMatchObject({
      accepted: false,
      reason: "zone_mismatch",
    });
  });

  it("rejects when PPS is not allowed for the selected zone", () => {
    const result = evaluatePpsEvent({
      observedPps: 8,
      activeDecisionPointId: "decision-1",
      selectedTargetZone: { ...zone, allowedPps: [1, 2, 4] },
      aimLon: zone.centerLon,
      aimLat: zone.centerLat,
    });

    expect(result).toMatchObject({
      accepted: false,
      reason: "pps_not_allowed",
    });
  });

  it("rejects aim points outside the selected target zone", () => {
    const result = evaluatePpsEvent({
      observedPps: 4,
      activeDecisionPointId: "decision-1",
      selectedTargetZone: zone,
      aimLon: -121.7,
      aimLat: 37.6,
    });

    expect(result).toMatchObject({
      accepted: false,
      reason: "outside_zone",
    });
  });

  it("uses meters for circle checks", () => {
    expect(pointInCircleMeters(zone.centerLon, zone.centerLat, zone.centerLon, zone.centerLat, 1)).toBe(true);
    expect(pointInCircleMeters(-121.7, 37.6, zone.centerLon, zone.centerLat, 250)).toBe(false);
  });
});
