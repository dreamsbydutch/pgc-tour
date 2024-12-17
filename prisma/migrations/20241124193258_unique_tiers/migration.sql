/*
  Warnings:

  - A unique constraint covering the columns `[name,year]` on the table `tiers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "tiers_name_year_key" ON "tiers"("name", "year");
