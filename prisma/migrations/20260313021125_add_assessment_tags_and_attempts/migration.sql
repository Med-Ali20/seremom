-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "AssessmentResult" ADD COLUMN     "attempt" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "AssessmentResult_userId_assessmentId_idx" ON "AssessmentResult"("userId", "assessmentId");
