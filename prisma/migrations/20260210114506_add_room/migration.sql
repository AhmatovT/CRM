/*
  Warnings:

  - You are about to drop the column `deleteReason` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `deletedById` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `nameNormalized` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `schoolId` on the `Room` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Room_schoolId_idx";

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "deleteReason",
DROP COLUMN "deletedById",
DROP COLUMN "nameNormalized",
DROP COLUMN "schoolId";

-- CreateIndex
CREATE INDEX "Room_deletedAt_idx" ON "Room"("deletedAt");
