/*
  Warnings:

  - You are about to drop the `Group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Room` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `firstName` to the `ManagerProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `ManagerProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `TeacherProfile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `TeacherProfile` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_roomId_fkey";

-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_teacherId_fkey";

-- AlterTable
ALTER TABLE "ManagerProfile" ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TeacherProfile" ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL;

-- DropTable
DROP TABLE "Group";

-- DropTable
DROP TABLE "Room";
