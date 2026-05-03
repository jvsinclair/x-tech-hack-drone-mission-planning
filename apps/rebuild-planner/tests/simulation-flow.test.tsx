import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerShell } from "@/components/PlannerShell";
import { fetchMock, getMockState, resetMockState } from "./mock-api";

beforeEach(() => {
  resetMockState();
  vi.stubGlobal("fetch", vi.fn(fetchMock));
});

async function enterRunAndStartSim() {
  render(<PlannerShell />);
  await screen.findByText("Mission Plans");
  fireEvent.click(screen.getByRole("button", { name: /plan mission/i }));
  fireEvent.click(screen.getByRole("button", { name: /launch selected plan/i }));
  await waitFor(() => expect(getMockState().currentSimulation).not.toBeNull());
}

describe("Simulation lifecycle", () => {
  it("starts paused at WP 1 with empty audit log", async () => {
    await enterRunAndStartSim();

    expect(screen.getByText("PAUSED")).toBeInTheDocument();
    expect(screen.getByText("WP 1")).toBeInTheDocument();
  });

  it("step advances to next waypoint", async () => {
    await enterRunAndStartSim();

    fireEvent.click(screen.getByRole("button", { name: /step/i }));
    await waitFor(() => expect(screen.getByText("WP 2")).toBeInTheDocument());
  });

  it("step to decision waypoint shows decision message in audit log", async () => {
    await enterRunAndStartSim();

    fireEvent.click(screen.getByRole("button", { name: /step/i }));
    await waitFor(() => expect(screen.getByText(/Decision Alpha reached/i)).toBeInTheDocument());
  });

  it("PPS 1 selects hold branch", async () => {
    await enterRunAndStartSim();
    fireEvent.click(screen.getByRole("button", { name: /step/i }));
    await waitFor(() => expect(getMockState().currentSimulation?.activeDecisionPointId).toBe("decision-1"));

    fireEvent.click(screen.getByRole("button", { name: /1 PPS/i }));
    await waitFor(() => expect(getMockState().currentSimulation?.activeBranchType).toBe("hold"));
  });

  it("PPS 2 selects land branch", async () => {
    await enterRunAndStartSim();
    fireEvent.click(screen.getByRole("button", { name: /step/i }));
    await waitFor(() => expect(getMockState().currentSimulation?.activeDecisionPointId).toBe("decision-1"));

    fireEvent.click(screen.getByRole("button", { name: /2 PPS/i }));
    await waitFor(() => expect(getMockState().currentSimulation?.activeBranchType).toBe("land"));
  });

  it("PPS 4 selects primary branch", async () => {
    await enterRunAndStartSim();
    fireEvent.click(screen.getByRole("button", { name: /step/i }));
    await waitFor(() => expect(getMockState().currentSimulation?.activeDecisionPointId).toBe("decision-1"));

    fireEvent.click(screen.getByRole("button", { name: /4 PPS/i }));
    await waitFor(() => expect(getMockState().currentSimulation?.activeBranchType).toBe("primary"));
  });

  it("PPS 8 selects alternate branch", async () => {
    await enterRunAndStartSim();
    fireEvent.click(screen.getByRole("button", { name: /step/i }));
    await waitFor(() => expect(getMockState().currentSimulation?.activeDecisionPointId).toBe("decision-1"));

    fireEvent.click(screen.getByRole("button", { name: /8 PPS/i }));
    await waitFor(() => expect(getMockState().currentSimulation?.activeBranchType).toBe("alternate"));
  });

  it("reset returns to WP 1 and clears branch state", async () => {
    await enterRunAndStartSim();
    fireEvent.click(screen.getByRole("button", { name: /step/i }));
    await waitFor(() => expect(getMockState().currentSimulation?.currentWaypointSeq).toBe(2));

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    await waitFor(() => {
      expect(getMockState().currentSimulation?.currentWaypointSeq).toBe(1);
      expect(getMockState().currentSimulation?.activeBranchType).toBeNull();
    });
  });
});
