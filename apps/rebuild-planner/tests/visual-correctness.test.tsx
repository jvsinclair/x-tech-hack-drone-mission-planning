import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerShell } from "@/components/PlannerShell";
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
});
