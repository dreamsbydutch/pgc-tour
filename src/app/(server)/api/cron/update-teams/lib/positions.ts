/**
 * Position calculation and leaderboard functions
 */

import type { Team, Tier, TourCard } from "@prisma/client";

/**
 * Groups teams by their tour ID
 */
export function groupTeamsByTour(
  teams: Team[],
  tourCards: TourCard[],
): Map<string, Team[]> {
  const teamsByTour = new Map<string, Team[]>();

  for (const team of teams) {
    const tourCard = tourCards.find((tc) => tc.id === team.tourCardId);
    if (tourCard) {
      const tourId = tourCard.tourId;
      if (!teamsByTour.has(tourId)) {
        teamsByTour.set(tourId, []);
      }
      teamsByTour.get(tourId)!.push(team);
    }
  }

  return teamsByTour;
}

/**
 * Calculates current and past positions for teams
 */
export function calculatePositions(teams: Team[]): Team[] {
  const activeTeams = teams.filter(
    (team) => team.position !== "CUT" && team.score !== null,
  );

  // Calculate current positions
  const sortedByScore = [...activeTeams].sort(
    (a, b) => (a.score ?? 999) - (b.score ?? 999),
  );
  assignPositions(sortedByScore, "position");

  // Calculate past positions
  const sortedByPastScore = [...activeTeams].sort((a, b) => {
    const pastScoreA = (a.score ?? 999) - (a.today ?? 0);
    const pastScoreB = (b.score ?? 999) - (b.today ?? 0);
    return pastScoreA - pastScoreB;
  });
  assignPastPositions(sortedByPastScore);

  return teams;
}

/**
 * Assigns positions to teams based on score
 */
function assignPositions(sortedTeams: Team[], positionKey: "position"): void {
  let currentPosition = 1;

  sortedTeams.forEach((team, index) => {
    if (index > 0 && team.score !== sortedTeams[index - 1]!.score) {
      currentPosition = index + 1;
    }

    const tiedTeams = sortedTeams.filter((t) => t.score === team.score);
    team[positionKey] =
      tiedTeams.length > 1 ? `T${currentPosition}` : `${currentPosition}`;
  });
}

/**
 * Assigns past positions to teams
 */
function assignPastPositions(sortedTeams: Team[]): void {
  let pastPosition = 1;

  sortedTeams.forEach((team, index) => {
    const pastScore = (team.score ?? 999) - (team.today ?? 0);

    if (index > 0) {
      const prevTeam = sortedTeams[index - 1]!;
      const prevPastScore = (prevTeam.score ?? 999) - (prevTeam.today ?? 0);
      if (pastScore !== prevPastScore) {
        pastPosition = index + 1;
      }
    }

    const tiedTeams = sortedTeams.filter(
      (t) => (t.score ?? 999) - (t.today ?? 0) === pastScore,
    );

    team.pastPosition =
      tiedTeams.length > 1 ? `T${pastPosition}` : `${pastPosition}`;
  });
}

/**
 * Calculates points and earnings for completed tournaments
 */
export function calculatePointsAndEarnings(teams: Team[], tier: Tier): void {
  for (const team of teams) {
    if (team.position === "CUT") {
      team.points = 0;
      team.earnings = 0;
      continue;
    }

    const position = parseInt(team.position?.replace("T", "") ?? "999");
    const isTied = team.position?.includes("T");

    if (isTied) {
      const tiedTeams = teams.filter((t) => t.position === team.position);
      const { points, earnings } = calculateTiedPrizes(
        tier,
        position,
        tiedTeams.length,
      );
      team.points = points;
      team.earnings = earnings;
    } else {
      team.points = tier.points[position - 1] ?? 0;
      team.earnings = tier.payouts[position - 1] ?? 0;
    }
  }
}

/**
 * Calculates prizes for tied positions
 */
function calculateTiedPrizes(
  tier: Tier,
  position: number,
  tiedCount: number,
): { points: number; earnings: number } {
  const startIndex = position - 1;
  const endIndex = startIndex + tiedCount;

  const totalPoints = tier.points
    .slice(startIndex, endIndex)
    .reduce((sum, p) => sum + p, 0);
  const totalEarnings = tier.payouts
    .slice(startIndex, endIndex)
    .reduce((sum, p) => sum + p, 0);

  return {
    points: Math.round(totalPoints / tiedCount),
    earnings: Math.round((totalEarnings / tiedCount) * 100) / 100,
  };
}
