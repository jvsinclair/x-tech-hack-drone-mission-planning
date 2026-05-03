import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerShell } from "@/components/PlannerShell";
import { formatLatLon, formatMgrs } from "@/lib/coordinates";
import { fetchMock, resetMockState } from "./mock-api";

beforeEach(() => {
  resetMockState();
  vi.stubGlobal("fetch", vi.fn(fetchMock));
});

describe("Visual correctness", () => {
  it("renders WaypointGlyph SVG for each waypoint marker, not default blue pins", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    const launchMarker = screen.getByTestId("map-waypoint-wp-launch");
    expect(launchMarker.querySelector(".waypoint-glyph-svg")).not.toBeNull();
    // No img tags (would indicate Cesium default blue pins)
    expect(launchMarker.querySelectorAll("img")).toHaveLength(0);
  });

  it("renders correct glyph for each behavior type", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    const launchMarker = screen.getByTestId("map-waypoint-wp-launch");
    const svg = launchMarker.querySelector(".waypoint-glyph-svg");
    expect(svg?.querySelector("title")?.textContent).toBe("Launch");

    const decisionMarker = screen.getByTestId("map-waypoint-wp-decision");
    const decisionSvg = decisionMarker.querySelector(".waypoint-glyph-svg");
    expect(decisionSvg?.querySelector("title")?.textContent).toBe("Decision");
  });

  it("DTZ markers render with zone styling", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    const zoneButton = screen.getByTestId("decision-zone-zone-1");
    expect(zoneButton.className).toContain("decision-zone");
    expect(zoneButton.querySelectorAll("img")).toHaveLength(0);
  });

  it("selected waypoint has waypoint-marker-selected class", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    const launchMarker = screen.getByTestId("map-waypoint-wp-launch");
    expect(launchMarker.className).not.toContain("selected");

    fireEvent.click(launchMarker);
    await waitFor(() => expect(launchMarker.className).toContain("waypoint-marker-selected"));
  });

  it("selected DTZ has decision-zone-selected class", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    const zoneButton = screen.getByTestId("decision-zone-zone-1");
    expect(zoneButton.className).not.toContain("selected");

    fireEvent.click(zoneButton);
    await waitFor(() => expect(zoneButton.className).toContain("decision-zone-selected"));
  });

  it("shows map-grid and lat/lon readouts keyed to the map center", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    const centerLon = (-121.9 + -121.74) / 2;
    const centerLat = (37.48 + 37.6) / 2;

    expect(screen.getByLabelText("Center map grid coordinate")).toHaveTextContent(formatMgrs(centerLon, centerLat));
    expect(screen.getByLabelText("Center coordinate readout")).toHaveTextContent(formatLatLon(centerLon, centerLat));
  });

  it("updates center coordinate readouts when the fallback map is panned", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    const mapStage = screen.getByTestId("mission-map-stage");
    mapStage.getBoundingClientRect = () =>
      ({
        left: 0,
        top: 0,
        right: 1000,
        bottom: 1000,
        width: 1000,
        height: 1000,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    fireEvent.mouseDown(mapStage, { button: 0, clientX: 500, clientY: 500 });
    fireEvent.mouseMove(mapStage, { clientX: 600, clientY: 550 });
    fireEvent.mouseUp(mapStage);

    const expectedLon = -121.9 + 0.4 * (-121.74 - -121.9);
    const expectedLat = 37.6 - 0.45 * (37.6 - 37.48);

    await waitFor(() => {
      expect(screen.getByLabelText("Center map grid coordinate")).toHaveTextContent(formatMgrs(expectedLon, expectedLat));
      expect(screen.getByLabelText("Center coordinate readout")).toHaveTextContent(formatLatLon(expectedLon, expectedLat));
    });
  });
});
