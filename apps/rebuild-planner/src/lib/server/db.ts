/*
Module Context
Purpose:
- Provide the Prisma client singleton for the rebuild planner backend.
Why This Exists:
- Next.js route handlers need one local SQLite-backed persistence boundary for launch packages and simulations.
Primary Inputs/Outputs:
- Inputs: DATABASE_URL.
- Outputs: PrismaClient instance.
Research / Source Links:
- docs/PALANTIR_REBUILD_MASTER_PRD.md
Validated:
- provisional: Exercised by route handlers during integration tests and local dev.
Current Limits / TODO:
- SQLite is the local MVP store; Palantir writeback is intentionally deferred.
Agent Maintenance Rule:
- Do not add secrets or environment-specific paths here.
*/

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
