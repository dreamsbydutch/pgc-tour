/*
  Warnings:

  - You are about to drop the column `firstName` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `fullName` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `members` table. All the data in the column will be lost.
  - You are about to drop the `Transactions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,startDate,tierId]` on the table `tournaments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fullname` to the `members` table without a default value. This is not possible if the table is not empty.
  - Made the column `buyIn` on table `tours` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "members" DROP COLUMN "firstName",
DROP COLUMN "fullName",
DROP COLUMN "lastName",
ADD COLUMN     "firstname" TEXT,
ADD COLUMN     "fullname" TEXT NOT NULL,
ADD COLUMN     "lastname" TEXT;

-- AlterTable
ALTER TABLE "tours" ALTER COLUMN "buyIn" SET NOT NULL;

-- DropTable
DROP TABLE "Transactions";

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "transactionType" "TransactionType" NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_name_startDate_tierId_key" ON "tournaments"("name", "startDate", "tierId");
