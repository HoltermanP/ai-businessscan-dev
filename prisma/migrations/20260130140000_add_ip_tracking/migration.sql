-- AlterTable
ALTER TABLE "Quickscan" ADD COLUMN "ipAddress" TEXT;

-- CreateIndex
CREATE INDEX "Quickscan_ipAddress_idx" ON "Quickscan"("ipAddress");
