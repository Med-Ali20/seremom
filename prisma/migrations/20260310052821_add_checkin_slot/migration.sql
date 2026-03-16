/*
  Warnings:

  - A unique constraint covering the columns `[userId,date,slot]` on the table `CheckIn` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CheckInSlot" AS ENUM ('MORNING', 'MIDDAY', 'EVENING');

-- DropIndex
DROP INDEX "CheckIn_userId_date_key";

-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "slot" "CheckInSlot" NOT NULL DEFAULT 'MORNING';

-- CreateIndex
CREATE INDEX "CheckIn_userId_idx" ON "CheckIn"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CheckIn_userId_date_slot_key" ON "CheckIn"("userId", "date", "slot");
