import { NextRequest, NextResponse } from "next/server";
import { startSimulation } from "@/lib/server/repository";
import { jsonError } from "@/lib/server/http";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { packageId?: string };
    if (!body.packageId) return jsonError("packageId is required.", 422);
    const simulation = await startSimulation(body.packageId);
    return NextResponse.json({ simulation }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
