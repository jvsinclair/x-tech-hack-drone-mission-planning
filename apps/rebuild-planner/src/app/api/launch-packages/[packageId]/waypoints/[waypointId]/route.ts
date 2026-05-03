import { NextRequest, NextResponse } from "next/server";
import { updateWaypoint, deleteWaypoint } from "@/lib/server/repository";
import { jsonError, routeParams } from "@/lib/server/http";
import type { WaypointBehavior } from "@/lib/types";

type Params = { packageId: string; waypointId: string };

export async function PATCH(request: NextRequest, context: { params: Params | Promise<Params> }) {
  try {
    const { packageId, waypointId } = await routeParams(context.params);
    const body = (await request.json()) as {
      name?: string;
      behavior?: WaypointBehavior;
      objective?: string;
      altitudeM?: number | null;
      dwellSeconds?: number | null;
      lon?: number;
      lat?: number;
    };
    const pkg = await updateWaypoint({ waypointId, packageId, ...body });
    return NextResponse.json({ package: pkg });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, context: { params: Params | Promise<Params> }) {
  try {
    const { packageId, waypointId } = await routeParams(context.params);
    const pkg = await deleteWaypoint({ waypointId, packageId });
    return NextResponse.json({ package: pkg });
  } catch (error) {
    return jsonError(error);
  }
}
