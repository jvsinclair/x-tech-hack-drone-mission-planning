import { NextRequest, NextResponse } from "next/server";
import { simulatePps } from "@/lib/server/repository";
import { jsonError, routeParams } from "@/lib/server/http";

export async function POST(request: NextRequest, context: { params: { simulationId: string } | Promise<{ simulationId: string }> }) {
  try {
    const { simulationId } = await routeParams(context.params);
    const body = (await request.json()) as { observedPps?: number; targetZoneId?: string; aimLon?: number; aimLat?: number };
    if (typeof body.observedPps !== "number") return jsonError("observedPps is required.", 422);
    const simulation = await simulatePps({
      simulationId,
      observedPps: body.observedPps,
      targetZoneId: body.targetZoneId,
      aimLon: body.aimLon,
      aimLat: body.aimLat,
    });
    return NextResponse.json({ simulation });
  } catch (error) {
    return jsonError(error);
  }
}
