/*
Module Context
Purpose:
- Compile an editable launch package into validation warnings and simulation readiness signals.
Why This Exists:
- The rebuild needs a deterministic backend check before route rehearsal without implying real drone control.
Primary Inputs/Outputs:
- Inputs: Launch package records and decision graph attachments.
- Outputs: Human-readable warnings with stable codes.
Research / Source Links:
- docs/PALANTIR_REBUILD_MASTER_PRD.md
Validated:
- provisional: Pure checks are intentionally simple for MVP and covered by API/UI flows.
Current Limits / TODO:
- Branch geometry validation is minimal until polygon/route authoring matures.
Agent Maintenance Rule:
- Add registry entries before introducing new thresholds or scoring rules.
*/

import type { LaunchPackageRecord, ValidationWarningRecord } from "@/lib/types";

export function compileLaunchPackage(pkg: LaunchPackageRecord): Omit<ValidationWarningRecord, "id" | "packageId">[] {
  const warnings: Omit<ValidationWarningRecord, "id" | "packageId">[] = [];
  const hasBehavior = (behavior: string) => pkg.waypoints.some((waypoint) => waypoint.behavior === behavior);

  if (!hasBehavior("launch")) {
    warnings.push({ code: "missing_launch", severity: "blocker", message: "Add a launch waypoint before simulation." });
  }
  if (!hasBehavior("decision")) {
    warnings.push({ code: "missing_decision", severity: "warning", message: "Add a decision waypoint to test PPS branch behavior." });
  }
  if (!hasBehavior("rtb")) {
    warnings.push({ code: "missing_rtb", severity: "warning", message: "Add an RTB waypoint or branch for 2 PPS behavior." });
  }

  for (const decisionPoint of pkg.decisionPoints) {
    if (decisionPoint.targetZones.length === 0) {
      warnings.push({
        code: "missing_decision_zone",
        severity: "blocker",
        message: `${decisionPoint.name} needs a decision target zone before PPS simulation.`,
      });
    }
    for (const branchType of ["primary", "alternate", "hold", "rtb"] as const) {
      const hasBranch = pkg.routeBranches.some((branch) => branch.decisionPointId === decisionPoint.id && branch.type === branchType);
      if (!hasBranch) {
        warnings.push({
          code: `missing_${branchType}_branch`,
          severity: branchType === "primary" || branchType === "alternate" ? "warning" : "info",
          message: `${decisionPoint.name} has no ${branchType} branch attachment yet.`,
        });
      }
    }
  }

  return warnings;
}
