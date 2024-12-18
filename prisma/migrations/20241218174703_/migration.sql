/*
  Warnings:

  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fullName` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "name",
ADD COLUMN     "fullName" TEXT NOT NULL,
ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");

-- AddForeignKey
ALTER TABLE "tour_cards" ADD CONSTRAINT "tour_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
