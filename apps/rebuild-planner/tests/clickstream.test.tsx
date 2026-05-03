import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerShell } from "@/components/PlannerShell";
import { fetchMock, getMockState, resetMockState } from "./mock-api";

beforeEach(() => {
  resetMockState();
  vi.stubGlobal("fetch", vi.fn(fetchMock));
});

function expectClickstream(target: string, kind?: string) {
  expect(getMockState().clickstream).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        target,
        ...(kind ? { kind } : {}),
      }),
    ]),
  );
}

describe("Debug clickstream", () => {
  it("records package creation", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    await waitFor(() => expectClickstream("create_package", "click"));
  });

  it("records map waypoint placement", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /place scout/i }));
    fireEvent.click(screen.getByTestId("map-click-surface"), { clientX: 500, clientY: 500 });

    await waitFor(() => expectClickstream("scout", "map_placement"));
  });

  it("records waypoint and zone selection", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /select launch/i }));
    fireEvent.click(screen.getByRole("button", { name: /select dtz-1/i }));

    await waitFor(() => {
      expectClickstream("waypoint", "select");
      expectClickstream("decision_zone", "select");
    });
  });

  it("records mode toggles and package expansion", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /plan mission/i }));
    fireEvent.click(packageRowButton());

    await waitFor(() => {
      expectClickstream("mode_toggle", "click");
      expectClickstream("package_expand", "click");
    });
  });

  it("records waypoint edits and deletes", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /select launch/i }));
    await screen.findByTestId("waypoint-edit-form");
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: "Edited launch" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expectClickstream("waypoint_update", "click"));

    fireEvent.click(screen.getByRole("button", { name: /delete waypoint/i }));
    await waitFor(() => expectClickstream("waypoint_delete", "click"));
  });

  it("records package rename", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.doubleClick(packageRowButton());
    const input = await screen.findByDisplayValue("Sunol surveillance package");
    fireEvent.change(input, { target: { value: "Ridge overwatch package" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expectClickstream("package_rename", "click"));
  });

  it("records zone edits and deletes", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /select dtz-1/i }));
    await screen.findByTestId("zone-edit-form");
    fireEvent.change(screen.getByLabelText(/radius/i), { target: { value: "400" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expectClickstream("zone_update", "click"));

    fireEvent.click(screen.getByRole("button", { name: /delete zone/i }));
    await waitFor(() => expectClickstream("zone_delete", "click"));
  });
});

function packageRowButton() {
  const rowButton = screen
    .getAllByRole("button", { name: /sunol surveillance package/i })
    .find((button) => button.className.includes("package-row-button"));
  if (!rowButton) throw new Error("Package row button not found.");
  return rowButton;
}
