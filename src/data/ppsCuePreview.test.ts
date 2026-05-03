import { describe, expect, it } from "vitest";
import { interpretPpsCueObservation } from "./ppsCuePreview";

describe("ppsCuePreview", () => {
  it("maps 4 PPS to Route B preview and requires confirmation", () => {
    const result = interpretPpsCueObservation({ observedPulseRatePps: 4 }, new Date("2026-05-03T08:00:00Z"));

    expect(result.status).toBe("passed");
    expect(result.matchedCommand).toBe("preview_route_b");
    expect(result.requiresConfirmation).toBe(true);
    expect(result.rationale).toContain("preview only");
  });

  it("maps 8 PPS to RTB preview and requires confirmation", () => {
    const result = interpretPpsCueObservation({ observedPulseRatePps: 8 }, new Date("2026-05-03T08:00:00Z"));

    expect(result.status).toBe("passed");
    expect(result.matchedCommand).toBe("preview_return_to_base");
    expect(result.requiresConfirmation).toBe(true);
  });

  it("ignores unknown cues without advancing command state", () => {
    const result = interpretPpsCueObservation({ observedPulseRatePps: 3 }, new Date("2026-05-03T08:00:00Z"));

    expect(result.status).toBe("warning");
    expect(result.matchedCommand).toBeUndefined();
    expect(result.requiresConfirmation).toBe(false);
    expect(result.warnings[0]).toContain("Ignored");
  });
});
