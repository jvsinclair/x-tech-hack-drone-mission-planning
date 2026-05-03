import { NextRequest, NextResponse } from "next/server";
import { updatePackage, deletePackage } from "@/lib/server/repository";
import { jsonError, routeParams } from "@/lib/server/http";

type Params = { packageId: string };

export async function PATCH(request: NextRequest, context: { params: Params | Promise<Params> }) {
  try {
    const { packageId } = await routeParams(context.params);
    const body = (await request.json()) as { name?: string; description?: string; status?: string };
    const pkg = await updatePackage({ packageId, ...body });
    return NextResponse.json({ package: pkg });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: NextRequest, context: { params: Params | Promise<Params> }) {
  try {
    const { packageId } = await routeParams(context.params);
    await deletePackage(packageId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
