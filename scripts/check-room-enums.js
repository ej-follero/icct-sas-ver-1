// scripts/check-room-enums.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const validBuildings = ["BuildingA", "BuildingB", "BuildingC", "BuildingD", "BuildingE"];
const validFloors = ["F1", "F2", "F3", "F4", "F5", "F6"];

async function main() {
  const rooms = await prisma.room.findMany();
  let foundInvalid = false;
  for (const room of rooms) {
    if (!validBuildings.includes(room.roomBuildingLoc) || !validFloors.includes(room.roomFloorLoc)) {
      foundInvalid = true;
      console.log("Invalid Room:", {
        id: room.roomId,
        roomNo: room.roomNo,
        roomBuildingLoc: room.roomBuildingLoc,
        roomFloorLoc: room.roomFloorLoc,
      });
    }
  }
  if (!foundInvalid) {
    console.log("All rooms have valid enum values.");
  }
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
}); 