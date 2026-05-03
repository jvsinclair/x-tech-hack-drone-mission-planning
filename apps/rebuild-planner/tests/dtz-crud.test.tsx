import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerShell } from "@/components/PlannerShell";
import { fetchMock, getMockState, resetMockState } from "./mock-api";

beforeEach(() => {
  resetMockState();
  vi.stubGlobal("fetch", vi.fn(fetchMock));
});

describe("Decision Target Zone editing", () => {
  it("shows an edit form when a DTZ is selected in Plan mode", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /select dtz-1/i }));
    await waitFor(() => expect(screen.getByTestId("zone-edit-form")).toBeInTheDocument());

    expect(screen.getByLabelText(/radius/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/center lat/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/center lon/i)).toBeInTheDocument();
  });

  it("submits edited radius", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /select dtz-1/i }));
    await waitFor(() => expect(screen.getByTestId("zone-edit-form")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/radius/i), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      const zones = getMockState().packages[0].decisionPoints[0].targetZones;
      expect(zones[0].radiusM).toBe(500);
    });
  });

  it("submits edited center coordinates", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /select dtz-1/i }));
    await waitFor(() => expect(screen.getByTestId("zone-edit-form")).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/center lat/i), { target: { value: "37.6" } });
    fireEvent.change(screen.getByLabelText(/center lon/i), { target: { value: "-121.8" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      const zones = getMockState().packages[0].decisionPoints[0].targetZones;
      expect(zones[0].centerLat).toBe(37.6);
      expect(zones[0].centerLon).toBe(-121.8);
    });
  });

  it("submits edited allowed PPS values", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /select dtz-1/i }));
    await waitFor(() => expect(screen.getByTestId("zone-edit-form")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText(/1 PPS/i));
    fireEvent.click(screen.getByLabelText(/8 PPS/i));
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      const zones = getMockState().packages[0].decisionPoints[0].targetZones;
      expect(zones[0].allowedPps).toEqual([2, 4]);
    });
  });

  it("does not show zone edit form in Run mode", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /plan mission/i }));
    fireEvent.click(screen.getByRole("button", { name: /select dtz-1/i }));

    expect(screen.queryByTestId("zone-edit-form")).not.toBeInTheDocument();
  });
});

describe("Decision Target Zone deletion", () => {
  it("shows a delete button for the selected DTZ", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /select dtz-1/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /delete zone/i })).toBeInTheDocument());
  });

  it("deletes a DTZ and removes it from the map", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    expect(getMockState().packages[0].decisionPoints[0].targetZones).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /select dtz-1/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /delete zone/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /delete zone/i }));

    await waitFor(() => {
      expect(getMockState().packages[0].decisionPoints[0].targetZones).toHaveLength(0);
    });
  });

  it("placing a DTZ immediately selects it and shows edit form", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /place target zone/i }));
    fireEvent.click(screen.getByTestId("map-click-surface"), { clientX: 510, clientY: 510 });

    await waitFor(() => expect(screen.getByTestId("zone-edit-form")).toBeInTheDocument());
  });

  it("keeps multiple DTZs independently selectable", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /place target zone/i }));
    fireEvent.click(screen.getByTestId("map-click-surface"), { clientX: 560, clientY: 520 });
    await waitFor(() => expect(screen.getByRole("button", { name: /select dtz-2/i })).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /select dtz-1/i }));
    await waitFor(() => expect(screen.getByTestId("zone-edit-form")).toHaveTextContent("DTZ-1"));

    fireEvent.click(screen.getByRole("button", { name: /select dtz-2/i }));
    await waitFor(() => expect(screen.getByTestId("zone-edit-form")).toHaveTextContent("DTZ-2"));
  });
});
