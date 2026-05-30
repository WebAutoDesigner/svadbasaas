-- CreateEnum
CREATE TYPE "WeddingStatus" AS ENUM ('PLANNING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Wedding" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "brideName" TEXT NOT NULL,
    "groomName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Moscow',
    "budget" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "guestCount" INTEGER,
    "coordinatorId" TEXT,
    "status" "WeddingStatus" NOT NULL DEFAULT 'PLANNING',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wedding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Wedding_agencyId_deletedAt_idx" ON "Wedding"("agencyId", "deletedAt");

-- CreateIndex
CREATE INDEX "Wedding_agencyId_date_idx" ON "Wedding"("agencyId", "date");

-- AddForeignKey
ALTER TABLE "Wedding" ADD CONSTRAINT "Wedding_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wedding" ADD CONSTRAINT "Wedding_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
