import { NextRequest, NextResponse } from "next/server";
import { reorderWaypoints } from "@/lib/server/repository";
import { jsonError, routeParams } from "@/lib/server/http";

export async function POST(request: NextRequest, context: { params: { packageId: string } | Promise<{ packageId: string }> }) {
  try {
    const { packageId } = await routeParams(context.params);
    const body = (await request.json()) as { waypointIds?: string[] };
    if (!Array.isArray(body.waypointIds)) {
      return jsonError("waypointIds array is required.", 422);
    }
    const pkg = await reorderWaypoints({ packageId, waypointIds: body.waypointIds });
    return NextResponse.json({ package: pkg });
  } catch (error) {
    return jsonError(error);
  }
}
