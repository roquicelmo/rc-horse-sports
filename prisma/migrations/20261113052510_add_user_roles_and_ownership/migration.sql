-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'USER';

-- AlterTable
ALTER TABLE "Arena" ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "Athlete" ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accessExpiresAt" TIMESTAMP(3),
ADD COLUMN     "managedById" TEXT,
ADD COLUMN     "provisional" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Arena_ownerId_idx" ON "Arena"("ownerId");

-- CreateIndex
CREATE INDEX "Athlete_ownerId_idx" ON "Athlete"("ownerId");

-- CreateIndex
CREATE INDEX "Event_createdById_idx" ON "Event"("createdById");

-- CreateIndex
CREATE INDEX "User_managedById_idx" ON "User"("managedById");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managedById_fkey" FOREIGN KEY ("managedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Arena" ADD CONSTRAINT "Arena_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Athlete" ADD CONSTRAINT "Athlete_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
