import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerShell } from "@/components/PlannerShell";
import { waypointBehaviors } from "@/lib/symbology/isr";
import { fetchMock, getMockState, resetMockState } from "./mock-api";

beforeEach(() => {
  resetMockState();
  vi.stubGlobal("fetch", vi.fn(fetchMock));
});

describe("PlannerShell", () => {
  it("loads the tactical planner without exposing old provisional wording", async () => {
    render(<PlannerShell />);

    expect(await screen.findByText("Sunol Ridge Training Area")).toBeInTheDocument();
    expect(screen.getByText("Mission Plans")).toBeInTheDocument();
    expect(screen.getByLabelText("Asset source")).toHaveValue("palantir");
    expect(screen.queryByText(/provisional/i)).not.toBeInTheDocument();
  });

  it("expands package rows and places one of each waypoint type from the palette", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    const surface = screen.getByTestId("map-click-surface");
    for (const behavior of waypointBehaviors) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`place ${behavior.label}`, "i") }));
      fireEvent.click(surface, { clientX: 500, clientY: 500 });
      await waitFor(() => expect(getMockState().packages[0].waypoints.at(-1)?.behavior).toBe(behavior.type));
    }

    expect(getMockState().packages[0].waypoints.map((wp) => wp.behavior)).toEqual(expect.arrayContaining(waypointBehaviors.map((b) => b.type)));
  }, 10000);

  it("places a decision target zone from the same plan rail", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /place target zone/i }));
    fireEvent.click(screen.getByTestId("map-click-surface"), { clientX: 510, clientY: 510 });

    await waitFor(() => expect(getMockState().packages[0].decisionPoints[0].targetZones).toHaveLength(2));
    expect(screen.getByText(/Decision target zone placed/i)).toBeInTheDocument();
  });

  it("auto-enters target-zone placement after adding a decision waypoint", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    const surface = screen.getByTestId("map-click-surface");

    fireEvent.click(screen.getByRole("button", { name: /place decision/i }));
    fireEvent.click(surface, { clientX: 520, clientY: 500 });

    await waitFor(() => expect(screen.getByTestId("pending-zone-prompt")).toBeInTheDocument());

    fireEvent.click(surface, { clientX: 540, clientY: 510 });

    await waitFor(() => {
      const newDecision = getMockState().packages[0].decisionPoints.find((point) => point.id === "decision-new");
      expect(newDecision?.targetZones).toHaveLength(1);
    });

    fireEvent.click(screen.getByRole("button", { name: /done/i }));
    expect(screen.queryByTestId("pending-zone-prompt")).not.toBeInTheDocument();
  });

  it("keeps selection inside the package area and supports run simulation controls", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /select launch/i }));
    expect(screen.getByTestId("active-package")).toHaveTextContent("Launch");

    fireEvent.click(screen.getByRole("button", { name: /plan mission/i }));
    fireEvent.click(screen.getByRole("button", { name: /launch selected plan/i }));
    await waitFor(() => expect(getMockState().currentSimulation).not.toBeNull());

    fireEvent.click(screen.getByRole("button", { name: /step/i }));
    await waitFor(() => expect(getMockState().currentSimulation?.currentWaypointSeq).toBe(2));

    fireEvent.click(screen.getByRole("button", { name: /4 PPS/i }));
    await waitFor(() => expect(getMockState().currentSimulation?.activeBranchType).toBe("primary"));
    expect(screen.getByText(/4 PPS accepted/i)).toBeInTheDocument();
  });

  it("moves waypoint overlays with the map during mouse drag", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    const mapStage = screen.getByTestId("mission-map-stage");
    const markerLayer = screen.getByTestId("map-marker-layer");
    const routeOverlay = screen.getByTestId("route-overlay");
    const launchMarker = screen.getByTestId("map-waypoint-wp-launch");

    expect(markerLayer).toContainElement(launchMarker);
    expect(markerLayer).toHaveStyle({ transform: "translate3d(0px, 0px, 0)" });

    fireEvent.mouseDown(mapStage, { button: 0, clientX: 480, clientY: 360 });
    fireEvent.mouseMove(mapStage, { clientX: 540, clientY: 390 });
    fireEvent.mouseUp(mapStage);

    await waitFor(() => {
      expect(markerLayer).toHaveStyle({ transform: "translate3d(60px, 30px, 0)" });
      expect(routeOverlay).toHaveStyle({ transform: "translate3d(60px, 30px, 0)" });
    });
  });

  it("keeps every overlay coupled to window-level map dragging from the Cesium surface", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    const cesiumSurface = screen.getByTestId("cesium-root");
    const markerLayer = screen.getByTestId("map-marker-layer");
    const routeOverlay = screen.getByTestId("route-overlay");
    const flightPath = screen.getByTestId("flight-route-path");
    const groundPath = screen.getByTestId("ground-route-path");
    const launchMarker = screen.getByTestId("map-waypoint-wp-launch");

    expect(markerLayer).toContainElement(launchMarker);
    expect(flightPath).toHaveAttribute("d", expect.stringContaining("M"));
    expect(groundPath).toHaveAttribute("d", expect.stringContaining("M"));
    expect(markerLayer).toHaveStyle({ transform: "translate3d(0px, 0px, 0)" });
    expect(routeOverlay).toHaveStyle({ transform: "translate3d(0px, 0px, 0)" });

    fireEvent.mouseDown(cesiumSurface, { button: 0, clientX: 420, clientY: 330 });
    fireEvent.mouseMove(window, { clientX: 545, clientY: 415 });
    fireEvent.mouseUp(window);

    await waitFor(() => {
      expect(markerLayer).toHaveStyle({ transform: "translate3d(125px, 85px, 0)" });
      expect(routeOverlay).toHaveStyle({ transform: "translate3d(125px, 85px, 0)" });
    });
  });

  it("starts in 3D terrain mode and can switch back to 2D map view", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    const terrainButton = screen.getByRole("button", { name: "3D" });
    const twoDimensionalButton = screen.getByRole("button", { name: "2D" });

    expect(terrainButton).toHaveAttribute("aria-pressed", "true");
    expect(twoDimensionalButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(twoDimensionalButton);

    expect(terrainButton).toHaveAttribute("aria-pressed", "false");
    expect(twoDimensionalButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(terrainButton);

    expect(terrainButton).toHaveAttribute("aria-pressed", "true");
    expect(twoDimensionalButton).toHaveAttribute("aria-pressed", "false");
  });

  it("deletes the selected waypoint with the Delete key", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    expect(getMockState().packages[0].waypoints).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: /select launch/i }));
    fireEvent.keyDown(window, { key: "Delete" });

    await waitFor(() => expect(getMockState().packages[0].waypoints).toHaveLength(1));
    expect(screen.queryByTestId("waypoint-edit-form")).not.toBeInTheDocument();
  });

  it("authors branch-local waypoints for each decision lane and deletes one with the Delete key", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    const surface = screen.getByTestId("map-click-surface");
    fireEvent.click(screen.getByRole("button", { name: /place target zone/i }));
    fireEvent.click(surface, { clientX: 520, clientY: 520 });
    await waitFor(() => expect(getMockState().packages[0].decisionPoints[0].targetZones).toHaveLength(2));
    fireEvent.click(screen.getByTestId("decision-zone-zone-1"));

    for (const lane of ["Primary", "Alternate", "Hold", "Land"]) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`select ${lane} branch lane`, "i") }));
      fireEvent.click(surface, { clientX: 500, clientY: 500 });
      await waitFor(() => expect(getMockState().packages[0].branchWaypoints.at(-1)?.branchType).toBe(lane.toLowerCase()));
    }

    expect(getMockState().packages[0].branchWaypoints.map((waypoint) => waypoint.name)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("DTZ-1 - Primary"),
        expect.stringContaining("DTZ-1 - Alternate"),
        expect.stringContaining("DTZ-1 - Hold"),
        expect.stringContaining("DTZ-1 - Land"),
      ]),
    );

    fireEvent.click(screen.getByTestId("map-branch-waypoint-branch-wp-1"));
    await waitFor(() => expect(screen.getByTestId("branch-waypoint-edit-form")).toBeInTheDocument());
    fireEvent.keyDown(window, { key: "Delete" });
    await waitFor(() => expect(getMockState().packages[0].branchWaypoints).toHaveLength(3));
  });

  it("keeps a selected DTZ lane active when choosing a waypoint tool", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    const surface = screen.getByTestId("map-click-surface");
    fireEvent.click(screen.getByRole("button", { name: /place target zone/i }));
    fireEvent.click(surface, { clientX: 520, clientY: 520 });
    await waitFor(() => expect(getMockState().packages[0].decisionPoints[0].targetZones).toHaveLength(2));

    fireEvent.click(screen.getByTestId("decision-zone-zone-1"));
    fireEvent.click(screen.getByRole("button", { name: /select primary branch lane/i }));
    fireEvent.click(screen.getByRole("button", { name: /place scout/i }));
    fireEvent.click(surface, { clientX: 560, clientY: 500 });

    await waitFor(() => expect(getMockState().packages[0].branchWaypoints).toHaveLength(1));
    expect(getMockState().packages[0].waypoints).toHaveLength(2);
    expect(getMockState().packages[0].branchWaypoints[0]).toMatchObject({
      behavior: "scout",
      branchType: "primary",
      decisionPointId: "decision-1",
      decisionTargetZoneId: "zone-1",
    });
    expect(screen.getByText(/Primary branch Scout placed from the decision point/i)).toBeInTheDocument();
  });

  it("draws authored DTZ branch paths from the parent decision waypoint", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    const surface = screen.getByTestId("map-click-surface");
    fireEvent.click(screen.getByRole("button", { name: /place target zone/i }));
    fireEvent.click(surface, { clientX: 520, clientY: 520 });
    await waitFor(() => expect(getMockState().packages[0].decisionPoints[0].targetZones).toHaveLength(2));

    fireEvent.click(screen.getByTestId("decision-zone-zone-1"));
    fireEvent.click(screen.getByRole("button", { name: /select primary branch lane/i }));
    fireEvent.click(screen.getByRole("button", { name: /place scout/i }));
    fireEvent.click(surface, { clientX: 560, clientY: 500 });

    await waitFor(() => {
      expect(screen.getByTestId("branch-path-zone-1-primary").getAttribute("d")).toContain(" L ");
    });
  });

  it("does not delete a waypoint when Delete is pressed inside an edit field", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /select launch/i }));
    const nameInput = await screen.findByLabelText(/^name$/i);
    fireEvent.keyDown(nameInput, { key: "Delete" });

    expect(getMockState().packages[0].waypoints).toHaveLength(2);
  });

  it("drags a selected waypoint and persists its new coordinates", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    const mapStage = screen.getByTestId("mission-map-stage");
    const launchMarker = screen.getByTestId("map-waypoint-wp-launch");
    const original = getMockState().packages[0].waypoints.find((waypoint) => waypoint.id === "wp-launch");

    fireEvent.mouseDown(launchMarker, { button: 0, clientX: 100, clientY: 767 });
    fireEvent.mouseMove(mapStage, { clientX: 200, clientY: 700 });
    fireEvent.mouseUp(mapStage);

    await waitFor(() => {
      const moved = getMockState().packages[0].waypoints.find((waypoint) => waypoint.id === "wp-launch");
      expect(moved?.lon).not.toBe(original?.lon);
      expect(moved?.lat).not.toBe(original?.lat);
    });
  });

  it("renders separate flight-level and ground-projection route paths", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    const flightPath = screen.getByTestId("flight-route-path");
    const groundPath = screen.getByTestId("ground-route-path");

    expect(flightPath).toHaveAttribute("d", expect.stringContaining("M"));
    expect(groundPath).toHaveAttribute("d", expect.stringContaining("M"));
    expect(flightPath.getAttribute("d")).not.toBe(groundPath.getAttribute("d"));
    expect((flightPath.getAttribute("d") ?? "").match(/ L /g)?.length ?? 0).toBeGreaterThan(2);
    expect(pathYStepsAreNotFlat(groundPath.getAttribute("d") ?? "")).toBe(true);
  });

  it("launches the selected mission plan when multiple plans exist", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    await waitFor(() => expect(getMockState().packages).toHaveLength(2));
    expect(screen.getByTestId("active-package")).toHaveTextContent("Selected Plan: Launch package 2");

    fireEvent.click(screen.getByRole("button", { name: /plan mission/i }));
    fireEvent.click(screen.getByRole("button", { name: /launch selected plan/i }));

    await waitFor(() => expect(getMockState().currentSimulation?.packageId).toBe("pkg-new"));
  });
});

function pathYStepsAreNotFlat(path: string): boolean {
  const yValues = [...path.matchAll(/[ML] [\d.-]+ ([\d.-]+)/g)].map((match) => Number(match[1]));
  const deltas = yValues.slice(1).map((value, index) => Number((value - yValues[index]).toFixed(3)));
  return new Set(deltas).size > 1;
}
