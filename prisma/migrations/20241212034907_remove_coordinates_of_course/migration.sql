/*
  Warnings:

  - You are about to drop the column `latitude` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `courses` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,par]` on the table `courses` will be added. If there are existing duplicate values, this will fail.
  - Made the column `par` on table `courses` required. This step will fail if there are existing NULL values in that column.
  - Made the column `front` on table `courses` required. This step will fail if there are existing NULL values in that column.
  - Made the column `back` on table `courses` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "courses_name_key";

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "latitude",
DROP COLUMN "longitude",
ALTER COLUMN "par" SET NOT NULL,
ALTER COLUMN "front" SET NOT NULL,
ALTER COLUMN "back" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "courses_name_par_key" ON "courses"("name", "par");
