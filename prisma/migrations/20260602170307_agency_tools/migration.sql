-- AlterTable
ALTER TABLE "Wedding" ADD COLUMN     "agencyFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "source" TEXT;

-- CreateTable
CREATE TABLE "WeddingContact" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeddingContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeddingNote" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeddingNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgencyPayment" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "paidOn" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgencyPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WeddingContact_weddingId_idx" ON "WeddingContact"("weddingId");

-- CreateIndex
CREATE INDEX "WeddingNote_weddingId_createdAt_idx" ON "WeddingNote"("weddingId", "createdAt");

-- CreateIndex
CREATE INDEX "AgencyPayment_weddingId_paidOn_idx" ON "AgencyPayment"("weddingId", "paidOn");

-- AddForeignKey
ALTER TABLE "WeddingContact" ADD CONSTRAINT "WeddingContact_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeddingNote" ADD CONSTRAINT "WeddingNote_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgencyPayment" ADD CONSTRAINT "AgencyPayment_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
