/*
  Warnings:

  - You are about to drop the column `earnings` on the `tour_cards` table. All the data in the column will be lost.
  - You are about to drop the column `owing` on the `tour_cards` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('TourCardFee', 'TournamentWinnings');

-- AlterTable
ALTER TABLE "tour_cards" DROP COLUMN "earnings",
DROP COLUMN "owing",
ADD COLUMN     "account" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "transactionType" "TransactionType" NOT NULL,

    CONSTRAINT "Transactions_pkey" PRIMARY KEY ("id")
);
