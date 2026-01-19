/*
  Warnings:

  - A unique constraint covering the columns `[userId,date]` on the table `CheckIn` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `diagnoses` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questions` to the `Assessment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CheckIn" DROP CONSTRAINT "CheckIn_userId_fkey";

-- DropIndex
DROP INDEX "CheckIn_date_key";

-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "diagnoses" JSONB NOT NULL,
ADD COLUMN     "questions" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "AssessmentCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentCategory_name_key" ON "AssessmentCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_userId_date_key" ON "CheckIn"("userId", "date");

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "AssessmentCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
