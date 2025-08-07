/*
  Warnings:

  - The `roomBuildingLoc` column on the `Room` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `roomFloorLoc` column on the `Room` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "RoomBuilding" AS ENUM ('BuildingA', 'BuildingB', 'BuildingC', 'BuildingD', 'BuildingE');

-- CreateEnum
CREATE TYPE "RoomFloor" AS ENUM ('F1', 'F2', 'F3', 'F4', 'F5', 'F6');

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "roomBuildingLoc",
ADD COLUMN     "roomBuildingLoc" "RoomBuilding",
DROP COLUMN "roomFloorLoc",
ADD COLUMN     "roomFloorLoc" "RoomFloor";

-- CreateIndex
CREATE INDEX "Room_roomBuildingLoc_roomFloorLoc_idx" ON "Room"("roomBuildingLoc", "roomFloorLoc");
