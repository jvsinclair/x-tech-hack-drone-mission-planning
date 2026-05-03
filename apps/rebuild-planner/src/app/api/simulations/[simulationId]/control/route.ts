import { NextRequest, NextResponse } from "next/server";
import { controlSimulation } from "@/lib/server/repository";
import { jsonError, routeParams } from "@/lib/server/http";

export async function POST(request: NextRequest, context: { params: { simulationId: string } | Promise<{ simulationId: string }> }) {
  try {
    const { simulationId } = await routeParams(context.params);
    const body = (await request.json()) as { action?: "pause" | "resume" | "reset" };
    if (body.action !== "pause" && body.action !== "resume" && body.action !== "reset") {
      return jsonError("action must be pause, resume, or reset.", 422);
    }
    const simulation = await controlSimulation(simulationId, body.action);
    return NextResponse.json({ simulation });
  } catch (error) {
    return jsonError(error);
  }
}
