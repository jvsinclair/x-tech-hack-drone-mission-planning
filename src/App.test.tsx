import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./components/CesiumMissionMap", () => ({
  CesiumMissionMap: () => <div data-testid="cesium-map" />,
}));

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the planner shell and fallback data without Palantir access", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not found", { status: 404 })));

    render(<App />);

    expect(screen.getByRole("heading", { name: /ISR Mission Planner/i })).toBeInTheDocument();
    expect(screen.getByTestId("cesium-map")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Provider:/i)).toHaveTextContent("placeholder"));
    expect(screen.getByLabelText(/Mission controls/i)).toBeInTheDocument();
    expect(screen.getByText("Editable plan state")).toBeInTheDocument();
    expect(screen.getByText(/Editing unlocked/i)).toBeInTheDocument();
  });

  it("creates a run snapshot, locks editing, and exposes named time jumps", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not found", { status: 404 })));

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Provider:/i)).toHaveTextContent("placeholder"));

    fireEvent.click(screen.getByRole("button", { name: "Run Mission" }));

    expect(screen.getByText("Run rehearsal snapshot")).toBeInTheDocument();
    expect(screen.getByText(/does not control a drone/i)).toBeInTheDocument();
    expect(screen.getByText(/Run snapshot active/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Target Identification" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "PPS Cue" }));

    expect(screen.getByText("Current Beat")).toBeInTheDocument();
    expect(screen.getAllByText("PPS Cue").length).toBeGreaterThan(0);
    expect(screen.getByText(/Jumped rehearsal timeline to PPS Cue/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Plan Mission" }));

    expect(screen.getByText("Editable plan state")).toBeInTheDocument();
    expect(screen.getByText(/Editing unlocked/i)).toBeInTheDocument();
  });
});
