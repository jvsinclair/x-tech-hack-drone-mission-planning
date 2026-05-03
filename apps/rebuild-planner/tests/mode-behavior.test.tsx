import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerShell } from "@/components/PlannerShell";
import { fetchMock, getMockState, resetMockState } from "./mock-api";

beforeEach(() => {
  resetMockState();
  vi.stubGlobal("fetch", vi.fn(fetchMock));
});

describe("Plan vs Run mode locking", () => {
  it("Plan mode shows the waypoint palette and editing controls", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    expect(screen.getByLabelText("Waypoint palette")).toBeInTheDocument();

    // Select a waypoint and check edit form appears
    fireEvent.click(screen.getByRole("button", { name: /select launch/i }));
    await waitFor(() => expect(screen.getByTestId("waypoint-edit-form")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /delete waypoint/i })).toBeInTheDocument();
  });

  it("Run mode hides the palette and disables editing", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    // Switch to Run mode
    fireEvent.click(screen.getByRole("button", { name: /plan mission/i }));

    // Palette should be hidden
    expect(screen.queryByLabelText("Waypoint palette")).not.toBeInTheDocument();

    // No edit form, no delete buttons
    expect(screen.queryByTestId("waypoint-edit-form")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete waypoint/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete zone/i })).not.toBeInTheDocument();
  });

  it("Run mode shows simulation controls", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /plan mission/i }));
    expect(screen.getByLabelText("Launch Package Simulation")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /launch selected plan/i })).toBeInTheDocument();
  });

  it("switching from Run back to Plan restores editing UI", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    // Go to Run
    fireEvent.click(screen.getByRole("button", { name: /plan mission/i }));
    expect(screen.queryByLabelText("Waypoint palette")).not.toBeInTheDocument();

    // Back to Plan
    fireEvent.click(screen.getByRole("button", { name: /run simulation/i }));
    expect(screen.getByLabelText("Waypoint palette")).toBeInTheDocument();
  });

  it("simulation state persists when switching modes", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    // Start sim in Run mode
    fireEvent.click(screen.getByRole("button", { name: /plan mission/i }));
    fireEvent.click(screen.getByRole("button", { name: /launch selected plan/i }));
    await waitFor(() => expect(getMockState().currentSimulation).not.toBeNull());

    fireEvent.click(screen.getByRole("button", { name: /step/i }));
    await waitFor(() => expect(getMockState().currentSimulation?.currentWaypointSeq).toBe(2));

    // Switch to Plan and back
    fireEvent.click(screen.getByRole("button", { name: /run simulation/i }));
    fireEvent.click(screen.getByRole("button", { name: /plan mission/i }));

    // Simulation still shows WP 2
    expect(screen.getByText("WP 2")).toBeInTheDocument();
  });
});
