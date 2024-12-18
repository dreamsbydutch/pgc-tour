/*
  Warnings:

  - You are about to drop the `members` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tour_cards" DROP CONSTRAINT "tour_cards_memberId_fkey";

-- DropTable
DROP TABLE "members";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'regular',
    "account" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "tour_cards" ADD CONSTRAINT "tour_cards_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
