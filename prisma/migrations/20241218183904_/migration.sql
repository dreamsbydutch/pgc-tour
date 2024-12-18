/*
  Warnings:

  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tour_cards" DROP CONSTRAINT "tour_cards_memberId_fkey";

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
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

-- AddForeignKey
ALTER TABLE "tour_cards" ADD CONSTRAINT "tour_cards_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
