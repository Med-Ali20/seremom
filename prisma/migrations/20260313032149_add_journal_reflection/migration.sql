-- CreateTable
CREATE TABLE "JournalReflection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalReflection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JournalReflection_userId_idx" ON "JournalReflection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JournalReflection_userId_date_key" ON "JournalReflection"("userId", "date");

-- AddForeignKey
ALTER TABLE "JournalReflection" ADD CONSTRAINT "JournalReflection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
