import { NextRequest, NextResponse } from "next/server";
import { addDecisionZone } from "@/lib/server/repository";
import { jsonError, routeParams } from "@/lib/server/http";

export async function POST(request: NextRequest, context: { params: { packageId: string } | Promise<{ packageId: string }> }) {
  try {
    const { packageId } = await routeParams(context.params);
    const body = (await request.json()) as { decisionPointId?: string; centerLon?: number; centerLat?: number; radiusM?: number };
    if (typeof body.centerLon !== "number" || typeof body.centerLat !== "number") {
      return jsonError("centerLon and centerLat are required.", 422);
    }
    const pkg = await addDecisionZone({
      packageId,
      decisionPointId: body.decisionPointId,
      centerLon: body.centerLon,
      centerLat: body.centerLat,
      radiusM: body.radiusM,
    });
    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
