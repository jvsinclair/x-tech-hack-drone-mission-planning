import { NextRequest, NextResponse } from "next/server";
import { getServerFoundryToken, loadFoundryContext } from "@/lib/palantir/client";
import { jsonError } from "@/lib/server/http";
import { loadLocalBundle } from "@/lib/server/localBundle";
import { ensureMissionAndStarter } from "@/lib/server/repository";

export async function GET(request: NextRequest) {
  try {
    const source = request.nextUrl.searchParams.get("source");
    if (source === "local") {
      const payload = await ensureMissionAndStarter(loadLocalBundle());
      return NextResponse.json(payload);
    }

    const requestToken = request.headers.get("x-foundry-token") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
    const token = getServerFoundryToken(requestToken);
    if (source === "palantir" && !token) {
      const fallback = loadLocalBundle();
      const payload = await ensureMissionAndStarter({
        ...fallback,
        mission: {
          ...fallback.mission,
          providerMessage: "Palantir token was not configured; loaded local Sunol mission bundle.",
        },
      });
      return NextResponse.json(payload);
    }

    const context = token ? await tryFoundry(token) : loadLocalBundle();
    const payload = await ensureMissionAndStarter(context);
    return NextResponse.json(payload);
  } catch (error) {
    return jsonError(error, 500);
  }
}

async function tryFoundry(token: string) {
  try {
    return await loadFoundryContext(token);
  } catch {
    const fallback = loadLocalBundle();
    return {
      ...fallback,
      mission: {
        ...fallback.mission,
        providerMessage: "Palantir was unavailable; loaded local Sunol mission bundle.",
      },
    };
  }
}
