/*
  Warnings:

  - Made the column `roomBuildingLoc` on table `Room` required. This step will fail if there are existing NULL values in that column.
  - Made the column `roomFloorLoc` on table `Room` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Room" ALTER COLUMN "roomBuildingLoc" SET NOT NULL,
ALTER COLUMN "roomFloorLoc" SET NOT NULL;
