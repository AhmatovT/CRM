/*
  Warnings:

  - Added the required column `salary` to the `ManagerProfile` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ManagerProfile_userId_idx";

-- AlterTable
ALTER TABLE "ManagerProfile" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "salary" INTEGER NOT NULL;
