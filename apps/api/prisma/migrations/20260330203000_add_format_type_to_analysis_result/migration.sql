-- CreateEnum
CREATE TYPE "FormatType" AS ENUM ('SHORT_FORM', 'STANDARD', 'LONG_FORM');

-- AlterTable
ALTER TABLE "AnalysisResult"
ADD COLUMN "formatType" "FormatType" NOT NULL DEFAULT 'STANDARD';
