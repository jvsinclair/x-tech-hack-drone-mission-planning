import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlannerShell } from "@/components/PlannerShell";
import { fetchMock, getMockState, resetMockState } from "./mock-api";

beforeEach(() => {
  resetMockState();
  vi.stubGlobal("fetch", vi.fn(fetchMock));
});

describe("Package management", () => {
  it("shows rename input on double-click and saves on Enter", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.doubleClick(packageRowButton());
    const input = await screen.findByDisplayValue("Sunol surveillance package");
    fireEvent.change(input, { target: { value: "Ridge overwatch package" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(getMockState().packages[0].name).toBe("Ridge overwatch package"));
    expect(screen.getAllByText("Ridge overwatch package").length).toBeGreaterThan(0);
  });

  it("shows a delete button on each package row", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    expect(screen.getByRole("button", { name: /delete sunol surveillance package/i })).toBeInTheDocument();
  });

  it("shows confirmation dialog before deleting a package with waypoints", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /delete sunol surveillance package/i }));
    await waitFor(() => expect(screen.getByTestId("confirm-delete")).toBeInTheDocument());
    expect(screen.getByText(/2 waypoints/i)).toBeInTheDocument();
  });

  it("confirms delete removes the package", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /delete sunol surveillance package/i }));
    await waitFor(() => expect(screen.getByTestId("confirm-delete")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));

    await waitFor(() => expect(getMockState().packages).toHaveLength(0));
  });

  it("cancelling delete confirmation does not delete", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /delete sunol surveillance package/i }));
    await waitFor(() => expect(screen.getByTestId("confirm-delete")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(getMockState().packages).toHaveLength(1);
    expect(screen.queryByTestId("confirm-delete")).not.toBeInTheDocument();
  });

  it("deletes an empty package immediately", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    await waitFor(() => expect(getMockState().packages).toHaveLength(2));

    fireEvent.click(screen.getByRole("button", { name: /delete launch package/i }));

    await waitFor(() => expect(getMockState().packages).toHaveLength(1));
    expect(screen.queryByTestId("confirm-delete")).not.toBeInTheDocument();
  });

  it("creating a new package expands it automatically", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    await waitFor(() => expect(getMockState().packages).toHaveLength(2));

    expect(screen.getByTestId("active-package")).toHaveTextContent("Launch package");
  });

  it("switching packages changes the waypoint list context", async () => {
    render(<PlannerShell />);
    await screen.findByText("Mission Plans");

    // Create second package (empty)
    fireEvent.click(screen.getByRole("button", { name: /add/i }));
    await waitFor(() => expect(getMockState().packages).toHaveLength(2));

    // The new (empty) package should be active -- check no waypoints shown
    expect(screen.getByText(/no waypoints/i)).toBeInTheDocument();
  });
});

function packageRowButton() {
  const rowButton = screen
    .getAllByRole("button", { name: /sunol surveillance package/i })
    .find((button) => button.className.includes("package-row-button"));
  if (!rowButton) throw new Error("Package row button not found.");
  return rowButton;
}
