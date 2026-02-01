/*
  Warnings:

  - You are about to drop the `Crew` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CrewMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CrewMemberRelationship` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CrewRelationship` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Npc` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Relationship` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Crew";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CrewMember";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CrewMemberRelationship";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "CrewRelationship";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Npc";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Relationship";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "imageCrop" TEXT,
    "faction" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'alive',
    "tags" TEXT,
    "posX" REAL,
    "posY" REAL,
    "campaignId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Character_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Organisation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "imageCrop" TEXT,
    "posX" REAL,
    "posY" REAL,
    "campaignId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Organisation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UniversalRelationship" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromEntityId" TEXT NOT NULL,
    "fromEntityType" TEXT NOT NULL,
    "toEntityId" TEXT NOT NULL,
    "toEntityType" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "strength" INTEGER NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_CharacterOrganisations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CharacterOrganisations_A_fkey" FOREIGN KEY ("A") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CharacterOrganisations_B_fkey" FOREIGN KEY ("B") REFERENCES "Organisation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UniversalRelationship_fromEntityId_fromEntityType_toEntityId_toEntityType_type_key" ON "UniversalRelationship"("fromEntityId", "fromEntityType", "toEntityId", "toEntityType", "type");

-- CreateIndex
CREATE UNIQUE INDEX "_CharacterOrganisations_AB_unique" ON "_CharacterOrganisations"("A", "B");

-- CreateIndex
CREATE INDEX "_CharacterOrganisations_B_index" ON "_CharacterOrganisations"("B");
