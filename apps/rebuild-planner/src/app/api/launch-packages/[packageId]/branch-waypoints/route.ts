import { NextRequest, NextResponse } from "next/server";
import { addBranchWaypoint } from "@/lib/server/repository";
import { jsonError, routeParams } from "@/lib/server/http";
import type { BranchType, WaypointBehavior } from "@/lib/types";

export async function POST(request: NextRequest, context: { params: { packageId: string } | Promise<{ packageId: string }> }) {
  try {
    const { packageId } = await routeParams(context.params);
    const body = (await request.json()) as {
      decisionPointId?: string;
      decisionTargetZoneId?: string;
      branchType?: BranchType;
      lon?: number;
      lat?: number;
      behavior?: WaypointBehavior;
      name?: string;
      objective?: string;
    };
    if (!body.decisionPointId || !body.decisionTargetZoneId || !body.branchType || typeof body.lon !== "number" || typeof body.lat !== "number") {
      return jsonError("decisionPointId, decisionTargetZoneId, branchType, lon, and lat are required.", 422);
    }
    const pkg = await addBranchWaypoint({
      packageId,
      decisionPointId: body.decisionPointId,
      decisionTargetZoneId: body.decisionTargetZoneId,
      branchType: body.branchType,
      lon: body.lon,
      lat: body.lat,
      behavior: body.behavior,
      name: body.name,
      objective: body.objective,
    });
    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
