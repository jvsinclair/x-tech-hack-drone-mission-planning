import { NextResponse } from "next/server";
import { compileAndStoreWarnings } from "@/lib/server/repository";
import { jsonError, routeParams } from "@/lib/server/http";

export async function POST(_request: Request, context: { params: { packageId: string } | Promise<{ packageId: string }> }) {
  try {
    const { packageId } = await routeParams(context.params);
    const pkg = await compileAndStoreWarnings(packageId);
    return NextResponse.json({ package: pkg });
  } catch (error) {
    return jsonError(error);
  }
}
