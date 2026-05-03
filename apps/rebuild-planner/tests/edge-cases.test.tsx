import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerShell } from "@/components/PlannerShell";
import { fetchMock, getMockState, resetMockState } from "./mock-api";
import { packageFixture } from "./fixtures";

beforeEach(() => {
  resetMockState();
  vi.stubGlobal("fetch", vi.fn(fetchMock));
});

describe("Edge cases", () => {
  it("handles empty package gracefully (no waypoints, no zones)", async () => {
    resetMockState({
      packages: [packageFixture({ waypoints: [], decisionPoints: [] })],
    });

    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    expect(screen.getByText(/no waypoints/i)).toBeInTheDocument();
  });

  it("switching packages clears waypoint selection", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    // Select a waypoint
    fireEvent.click(screen.getByRole("button", { name: /select launch/i }));
    await waitFor(() => expect(screen.getByTestId("waypoint-edit-form")).toBeInTheDocument());

    // Create and switch to new package
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    await waitFor(() => expect(getMockState().packages).toHaveLength(2));

    // Edit form should be gone since selection cleared
    expect(screen.queryByTestId("waypoint-edit-form")).not.toBeInTheDocument();
  });

  it("deleting the selected waypoint clears the selection", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /select launch/i }));
    await waitFor(() => expect(screen.getByTestId("waypoint-edit-form")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /delete waypoint/i }));
    await waitFor(() => expect(screen.queryByTestId("waypoint-edit-form")).not.toBeInTheDocument());

    expect(screen.getByText(/select a waypoint/i)).toBeInTheDocument();
  });

  it("deleting the only package shows empty state", async () => {
    resetMockState({
      packages: [packageFixture({ waypoints: [], decisionPoints: [] })],
    });

    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /delete sunol surveillance package/i }));
    await waitFor(() => expect(getMockState().packages).toHaveLength(0));

    expect(screen.getByText(/no packages/i)).toBeInTheDocument();
  });

  it("bootstrap error shows error status message", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("", { status: 500 }))));

    render(<PlannerShell />);
    await waitFor(() => expect(screen.getByText(/failed to load/i)).toBeInTheDocument());
  });

  it("map drag still works after placing and deleting waypoints", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    // Place a waypoint
    fireEvent.click(screen.getByRole("button", { name: /place launch/i }));
    fireEvent.click(screen.getByTestId("map-click-surface"), { clientX: 500, clientY: 500 });
    await waitFor(() => expect(getMockState().packages[0].waypoints).toHaveLength(3));

    // Drag the map
    const mapStage = screen.getByTestId("mission-map-stage");
    const markerLayer = screen.getByTestId("map-marker-layer");

    fireEvent.mouseDown(mapStage, { button: 0, clientX: 400, clientY: 300 });
    fireEvent.mouseMove(mapStage, { clientX: 450, clientY: 330 });
    fireEvent.mouseUp(mapStage);

    await waitFor(() => {
      expect(markerLayer).toHaveStyle({ transform: "translate3d(50px, 30px, 0)" });
    });
  });
});
