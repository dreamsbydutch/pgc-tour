/**
 * Testing Helpers
 *
 * Collection of test utilities, validation helpers, and assertion functions
 * for golf tournament application testing scenarios.
 */

import type {
  Tournament,
  Team,
  Golfer,
  Member,
  TourCard,
} from "@prisma/client";
import type { TournamentStatus } from "../system/caching";

// ============= ASSERTION HELPERS =============

/**
 * Validates golf score is within realistic bounds
 */
export function isValidScore(score: number | null): boolean {
  return (
    score === null ||
    (typeof score === "number" && !isNaN(score) && score >= -50 && score <= 50)
  );
}

/**
 * Validates golf position format (T1, 2, CUT, WD, DQ)
 */
export function isValidPosition(position: string | null): boolean {
  return position === null || /^(T?\d+|CUT|WD|DQ)$/.test(position);
}

/**
 * Validates golfer API ID is positive number
 */
export function isValidGolferId(apiId: number): boolean {
  return typeof apiId === "number" && apiId > 0;
}

/**
 * Validates team has required number of golfers (4-6)
 */
export function hasRequiredTeamGolfers(team: Team): boolean {
  return (
    Array.isArray(team.golferIds) &&
    team.golferIds.length >= 4 &&
    team.golferIds.length <= 6
  );
}

/**
 * Validates member has at least first or last name
 */
export function isValidMemberName(member: Member): boolean {
  return (
    (member.firstname !== null && member.firstname.length > 0) ||
    (member.lastname !== null && member.lastname.length > 0)
  );
}

/**
 * Validates tour card has required fields
 */
export function isValidTourCard(tourCard: TourCard): boolean {
  return (
    tourCard.displayName.length > 0 &&
    tourCard.memberId.length > 0 &&
    tourCard.tourId.length > 0
  );
}

// ============= VALIDATION HELPERS =============

/**
 * Validates team scoring logic against golfer scores
 */
export function validateTeamScore(team: Team, golfers: Golfer[]): boolean {
  const teamGolfers = golfers.filter((g) => team.golferIds.includes(g.apiId));
  const calculatedScore = teamGolfers.reduce(
    (sum, golfer) => sum + (golfer.score || 0),
    0,
  );
  return Math.abs(calculatedScore - (team.score || 0)) < 0.01;
}

/**
 * Validates leaderboard position ordering (lower scores first)
 */
export function validateLeaderboardOrder(teams: Team[]): boolean {
  for (let i = 1; i < teams.length; i++) {
    const prevTeam = teams[i - 1];
    const currentTeam = teams[i];

    if (!prevTeam || !currentTeam) continue;

    const prevScore = prevTeam.score || 0;
    const currentScore = currentTeam.score || 0;

    if (prevScore > currentScore) {
      return false;
    }
  }
  return true;
}

/**
 * Asserts tournament status matches expected value
 */
export function assertTournamentStatus(
  tournament: Tournament,
  expectedStatus: TournamentStatus,
  referenceDate: Date = new Date(),
): boolean {
  // Note: This would need the getTournamentStatus function imported
  // For now, basic date comparison
  const startDate = new Date(tournament.startDate);
  const endDate = new Date(tournament.endDate);

  if (referenceDate < startDate) {
    return expectedStatus === "upcoming";
  } else if (referenceDate > endDate) {
    return expectedStatus === "historical";
  } else {
    return expectedStatus === "current";
  }
}

// ============= DATE MANIPULATION HELPERS =============

/**
 * Date manipulation utilities for time-based testing
 */
export const testDateHelpers = {
  /**
   * Add days to a date
   */
  addDays: (date: Date, days: number): Date =>
    new Date(date.getTime() + days * 24 * 60 * 60 * 1000),

  /**
   * Subtract days from a date
   */
  subtractDays: (date: Date, days: number): Date =>
    new Date(date.getTime() - days * 24 * 60 * 60 * 1000),

  /**
   * Set time of day for a date
   */
  setTimeOfDay: (date: Date, hours: number, minutes: number = 0): Date => {
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  },

  /**
   * Check if two dates are the same day
   */
  isSameDay: (date1: Date, date2: Date): boolean =>
    date1.toDateString() === date2.toDateString(),
};

// ============= TEST ENVIRONMENT =============

/**
 * Test environment data structure
 */
export interface TestEnvironment {
  tournament: Tournament;
  teams: Team[];
  golfers: Golfer[];
  tours: any[];
  tourCards: TourCard[];
  members: Member[];
  findTeamByMember: (memberId: string) => Team | undefined;
  findGolfersForTeam: (teamId: number) => Golfer[];
  calculateTotalPoints: () => number;
}

/**
 * Creates test data helpers bound to specific mock data
 */
export function createTestEnvironmentHelpers(mockData: {
  tournament: Tournament;
  teams: Team[];
  golfers: Golfer[];
  tours: any[];
  tourCards: TourCard[];
  members: Member[];
}): TestEnvironment {
  return {
    ...mockData,
    findTeamByMember: (memberId: string) =>
      mockData.teams.find(
        (team) =>
          mockData.tourCards.find((tc) => tc.id === team.tourCardId)
            ?.memberId === memberId,
      ),
    findGolfersForTeam: (teamId: number) => {
      const team = mockData.teams.find((t) => t.id === teamId);
      return team
        ? mockData.golfers.filter((g) => team.golferIds.includes(g.apiId))
        : [];
    },
    calculateTotalPoints: () =>
      mockData.teams.reduce((sum, team) => sum + (team.points || 0), 0),
  };
}

// ============= ASSERTION COLLECTION =============

/**
 * Collection of common test assertions for golf data
 */
export const testAssertions = {
  isValidScore,
  isValidPosition,
  isValidGolferId,
  hasRequiredTeamGolfers,
  isValidMemberName,
  isValidTourCard,
} as const;
