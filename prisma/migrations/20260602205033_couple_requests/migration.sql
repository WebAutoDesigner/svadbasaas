-- CreateEnum
CREATE TYPE "TemplateType" AS ENUM ('QUESTIONNAIRE', 'CHECKLIST', 'TIMELINE', 'BUDGET');

-- CreateEnum
CREATE TYPE "RequestKind" AS ENUM ('QUESTIONNAIRE', 'TASK');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('OPEN', 'DONE');

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "type" "TemplateType" NOT NULL,
    "name" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoupleRequest" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "kind" "RequestKind" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT,
    "linkTo" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "CoupleRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestQuestion" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "answerText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RequestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestAttachment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Template_agencyId_type_idx" ON "Template"("agencyId", "type");

-- CreateIndex
CREATE INDEX "CoupleRequest_weddingId_status_idx" ON "CoupleRequest"("weddingId", "status");

-- CreateIndex
CREATE INDEX "RequestQuestion_requestId_idx" ON "RequestQuestion"("requestId");

-- CreateIndex
CREATE INDEX "RequestAttachment_requestId_idx" ON "RequestAttachment"("requestId");

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoupleRequest" ADD CONSTRAINT "CoupleRequest_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestQuestion" ADD CONSTRAINT "RequestQuestion_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CoupleRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestAttachment" ADD CONSTRAINT "RequestAttachment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CoupleRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
