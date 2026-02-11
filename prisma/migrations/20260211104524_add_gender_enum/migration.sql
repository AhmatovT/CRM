-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- AlterTable
ALTER TABLE "ManagerProfile" ADD COLUMN     "gender" "Gender";

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "gender" "Gender",
ALTER COLUMN "idCard" DROP NOT NULL,
ALTER COLUMN "photoUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "TeacherProfile" ADD COLUMN     "gender" "Gender";
