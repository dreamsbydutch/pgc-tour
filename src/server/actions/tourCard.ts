"use server";

import { getMemberFromHeaders } from "@/lib/supabase/auth-helpers";
import { db } from "../db";
import { getCurrentSeason } from "./season";
import type { TourCard } from "@prisma/client";
import { api } from "@/trpc/server";

/**
 * Gets the signed-in user's tour card for the current season
 */
export async function getCurrentTourCard(): Promise<TourCard | null> {
  const member = await getMemberFromHeaders();
  if (!member) return null;
  const season = await getCurrentSeason();
  if (!season) return null;
  return db.tourCard.findFirst({
    where: { memberId: member.id, seasonId: season.id },
  });
}

/**
 * Gets all tour cards for a given season
 */
export async function getSeasonTourCards(
  seasonId: string,
): Promise<TourCard[]> {
  return db.tourCard.findMany({ where: { seasonId } });
}

/**
 * Gets all tour cards for a given tour
 */
export async function getTourCardsByTour(tourId: string): Promise<TourCard[]> {
  return db.tourCard.findMany({ where: { tourId } });
}

/**
 * Gets all tour cards in the database
 */
export async function getAllTourCards(): Promise<TourCard[]> {
  return db.tourCard.findMany();
}

/**
 * Gets all tour cards for a given member
 */
export async function getMemberTourCards(
  memberId: string,
): Promise<TourCard[]> {
  return db.tourCard.findMany({ where: { memberId } });
}

/**
 * Deletes a tour card by id
 */
export async function deleteTourCard({ tourCard }: { tourCard: TourCard }): Promise<void> {
  await db.tourCard.delete({ where: { id: tourCard.id } });
}

/**
 * Creates a new tour card
 */
export async function createTourCard({
  tourId,
  seasonId,
}: {
  tourId: string;
  seasonId: string;
  [key: string]: unknown;
}): Promise<TourCard> {
  const member = await getMemberFromHeaders()
  if (!member) {
    throw new Error("User must be authenticated to create a tour card");
  }
  return api.tourCard.create({
      memberId:member.id,
      tourId,
      seasonId,
      displayName: member.firstname?.[0]?.toUpperCase() + " "+member.lastname,
  });
}
