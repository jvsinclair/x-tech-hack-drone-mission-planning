CREATE TABLE "Mission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "safetyScope" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "PalantirSourceCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "payload" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "LaunchPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "missionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LaunchPackage_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "DroneWaypoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "behavior" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT NOT NULL DEFAULT '',
    "lon" REAL NOT NULL,
    "lat" REAL NOT NULL,
    "altitudeM" REAL,
    "dwellSeconds" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DroneWaypoint_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "LaunchPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "DecisionPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "waypointId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DecisionPoint_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "LaunchPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DecisionPoint_waypointId_fkey" FOREIGN KEY ("waypointId") REFERENCES "DroneWaypoint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "DecisionTargetZone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "decisionPointId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "centerLon" REAL NOT NULL,
    "centerLat" REAL NOT NULL,
    "radiusM" REAL NOT NULL,
    "allowedPpsJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DecisionTargetZone_decisionPointId_fkey" FOREIGN KEY ("decisionPointId") REFERENCES "DecisionPoint" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "RouteBranch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "decisionPointId" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "geometryJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RouteBranch_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "LaunchPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RouteBranch_decisionPointId_fkey" FOREIGN KEY ("decisionPointId") REFERENCES "DecisionPoint" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "LaunchSimulation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'paused',
    "clockSeconds" INTEGER NOT NULL DEFAULT 0,
    "currentWaypointSeq" INTEGER NOT NULL DEFAULT 1,
    "activeDecisionPointId" TEXT,
    "selectedTargetZoneId" TEXT,
    "activeBranchType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LaunchSimulation_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "LaunchPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AuditLogEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "simulationId" TEXT,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "detailsJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLogEvent_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "LaunchPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditLogEvent_simulationId_fkey" FOREIGN KEY ("simulationId") REFERENCES "LaunchSimulation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ValidationWarning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ValidationWarning_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "LaunchPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "DebugClickEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "DroneWaypoint_packageId_sequence_key" ON "DroneWaypoint"("packageId", "sequence");
CREATE UNIQUE INDEX "DecisionPoint_waypointId_key" ON "DecisionPoint"("waypointId");
