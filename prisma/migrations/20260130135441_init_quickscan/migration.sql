-- CreateTable
CREATE TABLE "Quickscan" (
    "id" TEXT NOT NULL,
    "quickscanId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "companyDescription" TEXT NOT NULL,
    "aiOpportunities" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quickscan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FullQuickscan" (
    "id" TEXT NOT NULL,
    "quickscanId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fullAnalysis" JSONB NOT NULL,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FullQuickscan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quickscan_quickscanId_key" ON "Quickscan"("quickscanId");

-- CreateIndex
CREATE INDEX "Quickscan_quickscanId_idx" ON "Quickscan"("quickscanId");

-- CreateIndex
CREATE INDEX "Quickscan_createdAt_idx" ON "Quickscan"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FullQuickscan_quickscanId_key" ON "FullQuickscan"("quickscanId");

-- CreateIndex
CREATE INDEX "FullQuickscan_quickscanId_idx" ON "FullQuickscan"("quickscanId");

-- CreateIndex
CREATE INDEX "FullQuickscan_email_idx" ON "FullQuickscan"("email");
