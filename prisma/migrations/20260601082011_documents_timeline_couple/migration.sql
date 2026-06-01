-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "startMinutes" INTEGER NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "responsible" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoupleAccess" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "codeHash" TEXT,
    "codeExpiresAt" TIMESTAMP(3),
    "failedTries" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoupleAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoupleSession" (
    "id" TEXT NOT NULL,
    "coupleAccessId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoupleSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_weddingId_idx" ON "Document"("weddingId");

-- CreateIndex
CREATE INDEX "TimelineEvent_weddingId_startMinutes_idx" ON "TimelineEvent"("weddingId", "startMinutes");

-- CreateIndex
CREATE UNIQUE INDEX "CoupleAccess_weddingId_key" ON "CoupleAccess"("weddingId");

-- CreateIndex
CREATE INDEX "CoupleAccess_email_idx" ON "CoupleAccess"("email");

-- CreateIndex
CREATE INDEX "CoupleSession_expiresAt_idx" ON "CoupleSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimelineEvent" ADD CONSTRAINT "TimelineEvent_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleAccess" ADD CONSTRAINT "CoupleAccess_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleSession" ADD CONSTRAINT "CoupleSession_coupleAccessId_fkey" FOREIGN KEY ("coupleAccessId") REFERENCES "CoupleAccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;
