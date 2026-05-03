import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/server/http";
import { recordClickstream } from "@/lib/server/repository";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { kind?: string; target?: string; payload?: Record<string, unknown> };
    await recordClickstream(body.kind ?? "click", body.target ?? "unknown", body.payload ?? {});
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
