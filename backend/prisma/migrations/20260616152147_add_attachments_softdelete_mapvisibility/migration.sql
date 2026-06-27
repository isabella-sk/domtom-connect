/*
  Warnings:

  - You are about to drop the column `sourceNote` on the `scam_reports` table. All the data in the column will be lost.
  - You are about to drop the column `sourceType` on the `scam_reports` table. All the data in the column will be lost.
  - You are about to drop the column `sourceUrl` on the `scam_reports` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "conversation_members" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "deletedForIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "scam_reports" DROP COLUMN "sourceNote",
DROP COLUMN "sourceType",
DROP COLUMN "sourceUrl";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mapVisibility" TEXT NOT NULL DEFAULT 'everyone';

-- CreateTable
CREATE TABLE "scam_attachments" (
    "id" TEXT NOT NULL,
    "scamReportId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scam_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tip_attachments" (
    "id" TEXT NOT NULL,
    "tipId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tip_attachments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "scam_attachments" ADD CONSTRAINT "scam_attachments_scamReportId_fkey" FOREIGN KEY ("scamReportId") REFERENCES "scam_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tip_attachments" ADD CONSTRAINT "tip_attachments_tipId_fkey" FOREIGN KEY ("tipId") REFERENCES "tips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
