import { describe, expect, it, vi } from "vitest";
import { executeFoundryFunction } from "./foundryProvider";

describe("foundryProvider", () => {
  it("parses JSON-encoded Foundry Function string values", async () => {
    const fetcher = vi.fn(async () => Response.json({ value: JSON.stringify({ mission: { name: "Test mission" } }) }));

    const result = await executeFoundryFunction<{ mission: { name: string } }>("getMissionBundle", "token", fetcher);

    expect(result.mission.name).toBe("Test mission");
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining("/queries/getMissionBundle/execute"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ parameters: {} }),
      }),
    );
  });
});
