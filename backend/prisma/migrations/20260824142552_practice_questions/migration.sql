-- CreateTable
CREATE TABLE "PracticeQuestion" (
    "id" TEXT NOT NULL,
    "university" TEXT NOT NULL,
    "yearTag" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PracticeQuestion_university_yearTag_subject_idx" ON "PracticeQuestion"("university", "yearTag", "subject");
