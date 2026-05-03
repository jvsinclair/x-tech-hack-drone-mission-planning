/*
Module Context
Purpose:
- Keep route handler JSON error responses consistent.
Why This Exists:
- The rebuild exposes multiple local API endpoints and should fail in a debuggable way.
Primary Inputs/Outputs:
- Inputs: thrown errors or validation messages.
- Outputs: NextResponse JSON payloads.
Research / Source Links:
- docs/PALANTIR_REBUILD_MASTER_PRD.md
Validated:
- provisional: Used by all route handlers.
Current Limits / TODO:
- No structured problem-details schema yet.
Agent Maintenance Rule:
- Do not include secret-bearing request headers in errors.
*/

import { NextResponse } from "next/server";

export function jsonError(error: unknown, status = 400) {
  return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status });
}

export async function routeParams<T>(params: T | Promise<T>): Promise<T> {
  return await params;
}
