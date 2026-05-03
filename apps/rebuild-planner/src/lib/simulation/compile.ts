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
  if (!hasBehavior("land") && !pkg.branchWaypoints.some((waypoint) => waypoint.branchType === "land")) {
    warnings.push({ code: "missing_land", severity: "warning", message: "Add a Land waypoint or branch for 2 PPS behavior." });
  }

  for (const decisionPoint of pkg.decisionPoints) {
    if (decisionPoint.targetZones.length < 2) {
      warnings.push({
        code: "missing_decision_zone",
        severity: "blocker",
        message: `${decisionPoint.name} needs 2-4 decision target zones before branch authoring and PPS simulation.`,
      });
    }
    if (decisionPoint.targetZones.length > 4) {
      warnings.push({
        code: "too_many_decision_zones",
        severity: "blocker",
        message: `${decisionPoint.name} has more than 4 decision target zones.`,
      });
    }
    for (const zone of decisionPoint.targetZones) {
      for (const branchType of ["primary", "alternate", "hold", "land"] as const) {
        const hasBranchWaypoints = pkg.branchWaypoints.some(
          (waypoint) => waypoint.decisionPointId === decisionPoint.id && waypoint.decisionTargetZoneId === zone.id && waypoint.branchType === branchType,
        );
        if (!hasBranchWaypoints) {
          warnings.push({
            code: `missing_${branchType}_branch`,
            severity: branchType === "primary" || branchType === "alternate" ? "warning" : "info",
            message: `${zone.name} has no ${branchType} branch waypoint yet.`,
          });
        }
      }
    }
  }

  return warnings;
}
