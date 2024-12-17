/*
  Warnings:

  - You are about to drop the column `clerkId` on the `tour_cards` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,seasonId]` on the table `tour_cards` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `tour_cards` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "tour_cards_clerkId_seasonId_key";

-- AlterTable
ALTER TABLE "tour_cards" DROP COLUMN "clerkId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tour_cards_userId_seasonId_key" ON "tour_cards"("userId", "seasonId");
