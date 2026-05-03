import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

vi.mock("./components/CesiumMissionMap", () => ({
  CesiumMissionMap: () => <div data-testid="cesium-map" />,
}));

describe("App", () => {
  it("renders the planner shell and fallback data without Palantir access", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("not found", { status: 404 })));

    render(<App />);

    expect(screen.getByRole("heading", { name: /ISR Mission Planner/i })).toBeInTheDocument();
    expect(screen.getByTestId("cesium-map")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Provider:/i)).toHaveTextContent("placeholder"));
    expect(screen.getByLabelText(/Mission controls/i)).toBeInTheDocument();
  });
});
