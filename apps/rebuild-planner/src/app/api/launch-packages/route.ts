import { NextRequest, NextResponse } from "next/server";
import { createLaunchPackage, listLaunchPackages } from "@/lib/server/repository";
import { jsonError } from "@/lib/server/http";

export async function GET(request: NextRequest) {
  try {
    const missionId = request.nextUrl.searchParams.get("missionId") ?? undefined;
    return NextResponse.json({ packages: await listLaunchPackages(missionId) });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { missionId?: string; name?: string };
    if (!body.missionId) return jsonError("missionId is required.", 422);
    const pkg = await createLaunchPackage(body.missionId, body.name);
    return NextResponse.json({ package: pkg }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
