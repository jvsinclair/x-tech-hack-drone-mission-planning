import { NextRequest, NextResponse } from "next/server";
import { addWaypoint } from "@/lib/server/repository";
import { jsonError, routeParams } from "@/lib/server/http";
import type { WaypointBehavior } from "@/lib/types";

export async function POST(request: NextRequest, context: { params: { packageId: string } | Promise<{ packageId: string }> }) {
  try {
    const { packageId } = await routeParams(context.params);
    const body = (await request.json()) as { behavior?: WaypointBehavior; lon?: number; lat?: number; name?: string; objective?: string };
    if (!body.behavior || typeof body.lon !== "number" || typeof body.lat !== "number") {
      return jsonError("behavior, lon, and lat are required.", 422);
    }
    const pkg = await addWaypoint({ packageId, behavior: body.behavior, lon: body.lon, lat: body.lat, name: body.name, objective: body.objective });
    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
