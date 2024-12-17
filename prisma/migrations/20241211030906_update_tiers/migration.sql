/*
  Warnings:

  - You are about to drop the column `year` on the `tiers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,seasonId]` on the table `tiers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `seasonId` to the `tiers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `tour_cards` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "tiers_name_year_key";

-- AlterTable
ALTER TABLE "tiers" DROP COLUMN "year",
ADD COLUMN     "seasonId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tour_cards" ADD COLUMN     "fullName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tiers_name_seasonId_key" ON "tiers"("name", "seasonId");

-- AddForeignKey
ALTER TABLE "tiers" ADD CONSTRAINT "tiers_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
