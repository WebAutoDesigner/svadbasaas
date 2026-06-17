-- AlterTable
ALTER TABLE "CoupleAccess" ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "phone" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CoupleAccess_phone_key" ON "CoupleAccess"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

