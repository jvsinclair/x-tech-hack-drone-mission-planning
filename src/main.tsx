/*
Module Context
Purpose:
- Mount the Sunol ISR mission planner React application.
Why This Exists:
- Goal 0002 introduces the first runnable product surface for the hackathon demo.
Primary Inputs/Outputs:
- Inputs: Browser DOM root and application modules.
- Outputs: Interactive planner shell rendered into #root.
Research / Source Links:
- docs/PROJECT_CONTEXT.md
- docs/goals/0002-local-vite-cesium-planner-scaffold.md
Validated:
- provisional: Covered by build and shell render tests.
Current Limits / TODO:
- Foundry-hosted auth is represented by an adapter seam until Developer Console setup is complete.
Agent Maintenance Rule:
- If this module changes in any way, or a finding affects its contracts, update this header in the same change.
*/

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
