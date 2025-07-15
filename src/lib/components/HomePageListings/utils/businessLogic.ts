/**
 * HomePageListings - Business logic utilities
 */

import { MAJOR_TOURNAMENTS } from "./constants";
import type { HomePageListingsChampion } from "./types";

// Type for major tournament names
type MajorTournamentName = (typeof MAJOR_TOURNAMENTS)[number];

/**
 * Type guard to check if a tournament name is a major tournament
 */
function isMajorTournament(name: string): name is MajorTournamentName {
  return MAJOR_TOURNAMENTS.includes(name as MajorTournamentName);
}

/**
 * Filter champions for a specific member in a specific season
 */
export function filterChampionsForMember(
  champions: HomePageListingsChampion[] | null | undefined,
  memberId: string,
  seasonId: string,
): HomePageListingsChampion[] {
  if (!champions || !Array.isArray(champions)) {
    return [];
  }

  return champions.filter(
    (champion) =>
      champion.tourCard.memberId === memberId &&
      champion.tournament.seasonId === seasonId &&
      isMajorTournament(champion.tournament.name),
  );
}

/**
 * Check if a member has any major championships in a given season
 */
export function hasMajorChampionships(
  champions: HomePageListingsChampion[] | null | undefined,
  memberId: string,
  seasonId: string,
): boolean {
  const memberChampions = filterChampionsForMember(
    champions,
    memberId,
    seasonId,
  );
  return memberChampions.length > 0;
}

/**
 * Get major championship count for a member in a given season
 */
export function getMajorChampionshipCount(
  champions: HomePageListingsChampion[] | null | undefined,
  memberId: string,
  seasonId: string,
): number {
  const memberChampions = filterChampionsForMember(
    champions,
    memberId,
    seasonId,
  );
  return memberChampions.length;
}
