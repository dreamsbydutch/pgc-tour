/*
  Warnings:

  - You are about to drop the column `account` on the `tour_cards` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `tour_cards` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `tour_cards` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tour_cards" DROP COLUMN "account",
DROP COLUMN "email",
DROP COLUMN "fullName",
ADD COLUMN     "earnings" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'regular',
    "account" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "tour_cards" ADD CONSTRAINT "tour_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
