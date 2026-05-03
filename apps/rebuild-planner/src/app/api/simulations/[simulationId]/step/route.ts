import { NextResponse } from "next/server";
import { stepSimulation } from "@/lib/server/repository";
import { jsonError, routeParams } from "@/lib/server/http";

export async function POST(_request: Request, context: { params: { simulationId: string } | Promise<{ simulationId: string }> }) {
  try {
    const { simulationId } = await routeParams(context.params);
    const simulation = await stepSimulation(simulationId);
    return NextResponse.json({ simulation });
  } catch (error) {
    return jsonError(error);
  }
}
