-- AlterTable
ALTER TABLE "User" ADD COLUMN     "customRoleId" INTEGER;

-- CreateTable
CREATE TABLE "RoleManagement" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "totalUsers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleManagement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoleManagement_name_key" ON "RoleManagement"("name");

-- CreateIndex
CREATE INDEX "RoleManagement_status_idx" ON "RoleManagement"("status");

-- CreateIndex
CREATE INDEX "RoleManagement_name_idx" ON "RoleManagement"("name");

-- CreateIndex
CREATE INDEX "User_customRoleId_idx" ON "User"("customRoleId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "RoleManagement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
