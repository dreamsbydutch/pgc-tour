"use server";

import type { Season } from "@prisma/client";
import { db } from "../db";

/**
 * Gets the current season (by year, e.g., the current year)
 */
export async function getCurrentSeason(): Promise<Season | null> {
  const currentYear = new Date().getFullYear();
  return db.season.findFirst({
    where: { year: currentYear },
  });
}

/**
 * Gets all seasons, ordered by year ascending
 */
export async function getAllSeasons(): Promise<Season[]> {
  return db.season.findMany({ orderBy: { year: "asc" } });
}
