import { NextRequest, NextResponse } from "next/server";
import { updateDecisionZone, deleteDecisionZone } from "@/lib/server/repository";
import { jsonError, routeParams } from "@/lib/server/http";

type Params = { packageId: string; zoneId: string };

export async function PATCH(request: NextRequest, context: { params: Params | Promise<Params> }) {
  try {
    const { packageId, zoneId } = await routeParams(context.params);
    const body = (await request.json()) as {
      name?: string;
      centerLon?: number;
      centerLat?: number;
      radiusM?: number;
      allowedPps?: number[];
    };
    const pkg = await updateDecisionZone({ zoneId, packageId, ...body });
    return NextResponse.json({ package: pkg });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, context: { params: Params | Promise<Params> }) {
  try {
    const { packageId, zoneId } = await routeParams(context.params);
    const pkg = await deleteDecisionZone({ zoneId, packageId });
    return NextResponse.json({ package: pkg });
  } catch (error) {
    return jsonError(error);
  }
}
