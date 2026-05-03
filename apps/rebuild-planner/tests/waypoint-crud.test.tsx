import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerShell } from "@/components/PlannerShell";
import { fetchMock, getMockState, resetMockState } from "./mock-api";

beforeEach(() => {
  resetMockState();
  vi.stubGlobal("fetch", vi.fn(fetchMock));
});

describe("Waypoint editing", () => {
  it("renders an edit form when a waypoint is selected in Plan mode", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /select launch/i }));
    await waitFor(() => expect(screen.getByTestId("waypoint-edit-form")).toBeInTheDocument());

    expect(screen.getByLabelText(/^name$/i)).toHaveValue("Launch");
    expect(screen.getByLabelText(/altitude/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dwell/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/longitude/i)).toBeInTheDocument();
  });

  it("submits edited waypoint name and updates the list", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /select launch/i }));
    await waitFor(() => expect(screen.getByTestId("waypoint-edit-form")).toBeInTheDocument());

    const nameInput = screen.getByLabelText(/^name$/i);
    fireEvent.change(nameInput, { target: { value: "Alpha Override" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      const pkg = getMockState().packages[0];
      expect(pkg.waypoints.find((wp) => wp.id === "wp-launch")?.name).toBe("Alpha Override");
    });
  });

  it("submits edited altitude and dwell fields", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /select launch/i }));
    await waitFor(() => expect(screen.getByTestId("waypoint-edit-form")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/altitude/i), { target: { value: "200" } });
    fireEvent.change(screen.getByLabelText(/dwell/i), { target: { value: "45" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      const wp = getMockState().packages[0].waypoints.find((w) => w.id === "wp-launch");
      expect(wp?.altitudeM).toBe(200);
      expect(wp?.dwellSeconds).toBe(45);
    });
  });

  it("submits edited behavior dropdown", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /select launch/i }));
    await waitFor(() => expect(screen.getByTestId("waypoint-edit-form")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/behavior/i), { target: { value: "transit" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      const wp = getMockState().packages[0].waypoints.find((w) => w.id === "wp-launch");
      expect(wp?.behavior).toBe("transit");
    });
  });

  it("submits edited lat/lon coordinates", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /select launch/i }));
    await waitFor(() => expect(screen.getByTestId("waypoint-edit-form")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/latitude/i), { target: { value: "37.55" } });
    fireEvent.change(screen.getByLabelText(/longitude/i), { target: { value: "-121.85" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      const wp = getMockState().packages[0].waypoints.find((w) => w.id === "wp-launch");
      expect(wp?.lat).toBe(37.55);
      expect(wp?.lon).toBe(-121.85);
    });
  });

  it("does not show edit form in Run mode", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /plan mission/i }));
    expect(screen.queryByTestId("waypoint-edit-form")).not.toBeInTheDocument();
  });
});

describe("Waypoint deletion", () => {
  it("shows a delete button for the selected waypoint in Plan mode", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /select launch/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /delete waypoint/i })).toBeInTheDocument());
  });

  it("deletes a waypoint and removes it from the list", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    expect(getMockState().packages[0].waypoints).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /select launch/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /delete waypoint/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /delete waypoint/i }));

    await waitFor(() => expect(getMockState().packages[0].waypoints).toHaveLength(1));
    expect(getMockState().packages[0].waypoints[0].sequence).toBe(1);
  });

  it("deleting a decision waypoint also removes its linked DTZ", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    expect(getMockState().packages[0].decisionPoints).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /select decision alpha/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /delete waypoint/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /delete waypoint/i }));

    await waitFor(() => expect(getMockState().packages[0].decisionPoints).toHaveLength(0));
  });

  it("does not show delete button in Run mode", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /plan mission/i }));
    expect(screen.queryByRole("button", { name: /delete waypoint/i })).not.toBeInTheDocument();
  });
});

describe("Waypoint resequencing", () => {
  it("shows move-up and move-down buttons in the waypoint list", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    // First waypoint: no move-up, has move-down
    expect(screen.queryByRole("button", { name: /move launch up/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /move launch down/i })).toBeInTheDocument();

    // Last waypoint: has move-up, no move-down
    expect(screen.getByRole("button", { name: /move decision alpha up/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /move decision alpha down/i })).not.toBeInTheDocument();
  });

  it("moving a waypoint down swaps it with the next waypoint", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /move launch down/i }));

    await waitFor(() => {
      const wps = getMockState().packages[0].waypoints;
      expect(wps[0].id).toBe("wp-decision");
      expect(wps[1].id).toBe("wp-launch");
    });
  });

  it("moving a waypoint up swaps it with the previous waypoint", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /move decision alpha up/i }));

    await waitFor(() => {
      const wps = getMockState().packages[0].waypoints;
      expect(wps[0].id).toBe("wp-decision");
      expect(wps[1].id).toBe("wp-launch");
    });
  });
});
