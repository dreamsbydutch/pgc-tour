/*
  Warnings:

  - You are about to drop the column `userId` on the `tour_cards` table. All the data in the column will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[memberId,seasonId]` on the table `tour_cards` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `memberId` to the `tour_cards` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tour_cards" DROP CONSTRAINT "tour_cards_userId_fkey";

-- DropIndex
DROP INDEX "tour_cards_userId_seasonId_key";

-- AlterTable
ALTER TABLE "tour_cards" DROP COLUMN "userId",
ADD COLUMN     "memberId" TEXT NOT NULL;

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'regular',
    "account" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_id_key" ON "members"("id");

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tour_cards_memberId_seasonId_key" ON "tour_cards"("memberId", "seasonId");

-- AddForeignKey
ALTER TABLE "tour_cards" ADD CONSTRAINT "tour_cards_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
