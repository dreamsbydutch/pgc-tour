/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `courses` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "courses_name_par_key";

-- CreateIndex
CREATE UNIQUE INDEX "courses_name_key" ON "courses"("name");
