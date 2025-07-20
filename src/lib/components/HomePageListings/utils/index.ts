/**
 * HomePageListings - Utility functions
 */

import { formatMoney, formatScore } from "@pgc-utils";
import { MAX_TEAMS_DISPLAY, THRU_DISPLAY, DEFAULT_SCORES } from "./constants";
import type {
  HomePageListingsTeam,
  HomePageListingsTourCard,
  HomePageListingsLeaderboardTeam,
} from "./types";

/**
 * Transform tour cards data for standings view
 */
export function transformTourCardsForStandings(
  tourCards: HomePageListingsTourCard[],
  tourId: string,
): HomePageListingsTeam[] {
  return tourCards
    .filter((tc) => tc.tourId === tourId)
    .sort((a, b) => b.points - a.points)
    .slice(0, MAX_TEAMS_DISPLAY)
    .map((team) => ({
      ...team,
      mainStat: team.points,
      secondaryStat: formatMoney(team.earnings),
    }));
}

/**
 * Transform leaderboard teams data for leaderboard view
 */
export function transformLeaderboardTeams(
  teams: HomePageListingsLeaderboardTeam[],
): HomePageListingsTeam[] {
  return teams
    .sort(
      (a, b) =>
        (a.score ?? DEFAULT_SCORES.MISSING_SCORE) -
        (b.score ?? DEFAULT_SCORES.MISSING_SCORE),
    )
    .slice(0, MAX_TEAMS_DISPLAY)
    .map((team) => ({
      ...team,
      id: team.id,
      displayName: team.tourCard.displayName,
      memberId: team.tourCard.memberId,
      mainStat: formatScore(team.score),
      secondaryStat:
        team.thru === 0
          ? THRU_DISPLAY.NOT_STARTED
          : team.thru === THRU_DISPLAY.HOLES_COMPLETED
            ? THRU_DISPLAY.FINISHED
            : team.thru,
    }));
}

/**
 * Get the link URL for a tour based on view type
 */
export function getTourLink(
  viewType: "standings" | "leaderboard",
  tourId: string,
  tournamentId?: string,
): string {
  if (viewType === "standings") {
    return `/standings?tourId=${tourId}`;
  } else {
    return `/tournament/${tournamentId}?tourId=${tourId}`;
  }
}

/**
 * Get the aria-label for a tour link
 */
export function getTourAriaLabel(
  viewType: "standings" | "leaderboard",
  tourShortForm: string,
): string {
  if (viewType === "standings") {
    return `View standings for ${tourShortForm} Tour`;
  } else {
    return `View leaderboard for ${tourShortForm} Tour`;
  }
}

/**
 * Check if user should be highlighted as friend or self
 */
export function getUserHighlightStatus(
  memberId: string,
  self: { id: string; friends: string[] } | null,
): {
  isFriend: boolean;
  isSelf: boolean;
} {
  const isFriend = !!self?.friends?.includes(memberId);
  const isSelf = self?.id === memberId;

  return { isFriend, isSelf };
}

// Re-export business logic utilities
export {
  filterChampionsForMember,
  hasMajorChampionships,
  getMajorChampionshipCount,
} from "./businessLogic";
