-- Add branch-local waypoints for per-DTZ route authoring.
CREATE TABLE "BranchWaypoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "decisionPointId" TEXT NOT NULL,
    "decisionTargetZoneId" TEXT NOT NULL,
    "branchType" TEXT NOT NULL,
    "branchSequence" INTEGER NOT NULL,
    "behavior" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT NOT NULL DEFAULT '',
    "lon" REAL NOT NULL,
    "lat" REAL NOT NULL,
    "altitudeM" REAL,
    "dwellSeconds" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BranchWaypoint_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "LaunchPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BranchWaypoint_decisionPointId_fkey" FOREIGN KEY ("decisionPointId") REFERENCES "DecisionPoint" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BranchWaypoint_decisionTargetZoneId_fkey" FOREIGN KEY ("decisionTargetZoneId") REFERENCES "DecisionTargetZone" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "BranchWaypoint_decisionTargetZoneId_branchType_branchSequence_key"
ON "BranchWaypoint"("decisionTargetZoneId", "branchType", "branchSequence");

-- Normalize the previous demo default from 120 m AGL to the approved 20 m AGL.
UPDATE "DroneWaypoint"
SET "altitudeM" = 20
WHERE "altitudeM" IS NULL OR "altitudeM" = 120;

UPDATE "DroneWaypoint"
SET "behavior" = 'land'
WHERE "behavior" = 'rtb';

UPDATE "RouteBranch"
SET "type" = 'land', "name" = REPLACE("name", 'RTB', 'Land')
WHERE "type" = 'rtb' OR "name" LIKE '%RTB%';
