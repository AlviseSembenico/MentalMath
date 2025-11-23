-- AlterTable
ALTER TABLE "History" ADD COLUMN     "operations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "timeTaken" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ProblemAttempt" (
    "id" SERIAL NOT NULL,
    "historyId" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "answer" INTEGER NOT NULL,
    "userAnswer" INTEGER NOT NULL,
    "operation" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProblemAttempt_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProblemAttempt" ADD CONSTRAINT "ProblemAttempt_historyId_fkey" FOREIGN KEY ("historyId") REFERENCES "History"("id") ON DELETE CASCADE ON UPDATE CASCADE;
