/**
 * @fileoverview Comprehensive test utilities for golf tournament application
 *
 * Provides mock data, test helpers, and utility functions for testing
 * tournament leaderboards, team formations, and golf scoring logic.
 */

import type {
  Tournament,
  Tour,
  TourCard,
  Member,
  Team,
  Golfer,
  Tier,
  Course,
  Season,
} from "@prisma/client";
import { getTournamentStatus } from "@/old-utils";
import type { TournamentStatus } from "./caching";

// ============= MOCK DATA GENERATORS =============

/**
 * Generates a mock course with realistic golf course data
 */
export function createMockCourse(overrides?: Partial<Course>): Course {
  return {
    id: "course-1",
    apiId: "api-course-1",
    name: "Augusta National Golf Club",
    location: "Augusta, Georgia",
    par: 72,
    front: 36,
    back: 36,
    timeZoneOffset: -5,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Generates a mock season with proper date ranges
 */
export function createMockSeason(overrides?: Partial<Season>): Season {
  return {
    id: "season-2024",
    year: 2024,
    number: 1,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Generates a mock tier with realistic tournament structure
 */
export function createMockTier(overrides?: Partial<Tier>): Tier {
  return {
    id: "tier-major",
    name: "Major Championship",
    payouts: [50000, 30000, 20000, 15000, 10000],
    points: [500, 300, 200, 150, 100],
    seasonId: "season-2024",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Generates a mock tour with realistic tour structure
 */
export function createMockTour(overrides?: Partial<Tour>): Tour {
  return {
    id: "tour-pga",
    name: "PGA Tour",
    logoUrl: "https://example.com/pga-logo.png",
    seasonId: "season-2024",
    shortForm: "PGA",
    buyIn: 100,
    playoffSpots: [8, 4], // 8 gold spots, 4 silver spots
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Generates a mock member with realistic player data
 */
export function createMockMember(overrides?: Partial<Member>): Member {
  return {
    id: "member-1",
    firstname: "John",
    lastname: "Smith",
    email: "john.smith@example.com",
    role: "regular",
    account: 1000.0,
    friends: [],
    ...overrides,
  };
}

/**
 * Generates a mock tour card linking member to tour
 */
export function createMockTourCard(overrides?: Partial<TourCard>): TourCard {
  return {
    id: "tourcard-1",
    displayName: "John S.",
    earnings: 25000.0,
    points: 350.0,
    win: 1.0,
    topTen: 3.0,
    madeCut: 8.0,
    appearances: 10,
    playoff: 1,
    position: "5",
    memberId: "member-1",
    tourId: "tour-pga",
    seasonId: "season-2024",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Generates a mock tournament with realistic scheduling
 */
export function createMockTournament(
  overrides?: Partial<Tournament>,
): Tournament {
  const startDate = new Date("2024-06-15");
  const endDate = new Date("2024-06-18");

  return {
    id: "tournament-1",
    name: "The Masters Tournament",
    startDate,
    endDate,
    tierId: "tier-major",
    courseId: "course-1",
    seasonId: "season-2024",
    apiId: "api-tournament-1",
    currentRound: 4,
    livePlay: false,
    logoUrl: "https://example.com/masters-logo.png",
    createdAt: new Date("2024-01-01"),
    updatedAt: endDate,
    ...overrides,
  };
}

/**
 * Generates a mock golfer with realistic scoring data
 */
export function createMockGolfer(overrides?: Partial<Golfer>): Golfer {
  return {
    id: 1,
    apiId: 123456,
    country: "USA",
    position: "T1",
    posChange: 0,
    playerName: "Tiger Woods",
    score: -12,
    makeCut: 1.0,
    topTen: 1.0,
    win: 1.0,
    today: -2,
    thru: 18,
    round: 4,
    roundOneTeeTime: "8:00 AM",
    roundOne: -3,
    roundTwoTeeTime: "1:00 PM",
    roundTwo: -2,
    roundThreeTeeTime: "9:30 AM",
    roundThree: -4,
    roundFourTeeTime: "2:15 PM",
    roundFour: -3,
    endHole: 18,
    group: 1,
    worldRank: 1,
    rating: 9.8,
    usage: 85.5,
    earnings: 50000.0,
    tournamentId: "tournament-1",
    createdAt: new Date("2024-06-18"),
    updatedAt: new Date("2024-06-18"),
    ...overrides,
  };
}

/**
 * Generates a mock team with realistic tournament performance
 */
export function createMockTeam(overrides?: Partial<Team>): Team {
  return {
    id: 1,
    tournamentId: "tournament-1",
    tourCardId: "tourcard-1",
    golferIds: [123456, 123457, 123458, 123459],
    position: "T1",
    pastPosition: "2",
    score: -45.0,
    points: 500.0,
    earnings: 50000.0,
    makeCut: 1.0,
    today: -8.0,
    thru: 72.0,
    round: 4,
    roundOneTeeTime: "8:00 AM",
    roundOne: -12.0,
    roundTwoTeeTime: "1:00 PM",
    roundTwo: -10.0,
    roundThreeTeeTime: "9:30 AM",
    roundThree: -11.0,
    roundFourTeeTime: "2:15 PM",
    roundFour: -12.0,
    topTen: 1.0,
    topFive: 1.0,
    topThree: 1.0,
    win: 1.0,
    createdAt: new Date("2024-06-15"),
    updatedAt: new Date("2024-06-18"),
    ...overrides,
  };
}

// ============= MOCK DATA COLLECTIONS =============

/**
 * Creates a complete tournament leaderboard scenario
 */
export function createMockLeaderboard(teamCount: number = 5): {
  tournament: Tournament;
  teams: Team[];
  golfers: Golfer[];
  tours: Tour[];
  tourCards: TourCard[];
  members: Member[];
} {
  const tournament = createMockTournament();
  const tour = createMockTour();
  const tours = [tour];

  const teams: Team[] = [];
  const golfers: Golfer[] = [];
  const tourCards: TourCard[] = [];
  const members: Member[] = [];

  for (let i = 0; i < teamCount; i++) {
    // Create member and tour card
    const member = createMockMember({
      id: `member-${i + 1}`,
      firstname: `Player`,
      lastname: `${i + 1}`,
      email: `player${i + 1}@example.com`,
    });

    const tourCard = createMockTourCard({
      id: `tourcard-${i + 1}`,
      displayName: `Player ${i + 1}`,
      memberId: member.id,
      tourId: tour.id,
      position: (i + 1).toString(),
    });

    // Create team golfers
    const teamGolfers: Golfer[] = [];
    const teamGolferIds: number[] = [];

    for (let j = 0; j < 4; j++) {
      const apiId = (i + 1) * 1000 + (j + 1);
      const golfer = createMockGolfer({
        id: (i + 1) * 10 + (j + 1),
        apiId: apiId,
        playerName: `Golfer ${i + 1}-${j + 1}`,
        position: (i + 1).toString(),
        score: -10 + i * 2 + Math.floor(Math.random() * 4),
        today: Math.floor(Math.random() * 6) - 3,
      });
      teamGolfers.push(golfer);
      golfers.push(golfer);
      teamGolferIds.push(apiId);
    }

    // Create team
    const team = createMockTeam({
      id: i + 1,
      tourCardId: tourCard.id,
      golferIds: teamGolferIds,
      position: (i + 1).toString(),
      score: teamGolfers.reduce((sum, g) => sum + (g.score || 0), 0),
      points: Math.max(500 - i * 50, 50),
      earnings: Math.max(50000 - i * 5000, 1000),
    });

    teams.push(team);
    tourCards.push(tourCard);
    members.push(member);
  }

  return {
    tournament,
    teams,
    golfers,
    tours,
    tourCards,
    members,
  };
}

/**
 * Creates mock seasonal data for testing year-long scenarios
 */
export function createMockSeasonData(tournamentCount: number = 10): {
  season: Season;
  tournaments: Tournament[];
  tours: Tour[];
  tiers: Tier[];
  courses: Course[];
  members: Member[];
  tourCards: TourCard[];
} {
  const season = createMockSeason();
  const tours = [
    createMockTour({ id: "tour-pga", name: "PGA Tour" }),
    createMockTour({
      id: "tour-euro",
      name: "European Tour",
      logoUrl: "https://example.com/euro-logo.png",
      shortForm: "EURO",
    }),
  ];

  const tiers = [
    createMockTier({ id: "tier-major", name: "Major" }),
    createMockTier({
      id: "tier-regular",
      name: "Regular",
      payouts: [25000, 15000, 10000, 7500, 5000],
      points: [250, 150, 100, 75, 50],
    }),
  ];

  const courses: Course[] = [];
  const tournaments: Tournament[] = [];

  for (let i = 0; i < tournamentCount; i++) {
    const course = createMockCourse({
      id: `course-${i + 1}`,
      apiId: `api-course-${i + 1}`,
      name: `Test Course ${i + 1}`,
      location: `Location ${i + 1}`,
    });

    const startDate = new Date(2024, i, 15); // Spread throughout year
    const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);

    const tournament = createMockTournament({
      id: `tournament-${i + 1}`,
      name: `Tournament ${i + 1}`,
      startDate,
      endDate,
      courseId: course.id,
      tierId: i % 3 === 0 ? "tier-major" : "tier-regular",
      apiId: `api-tournament-${i + 1}`,
    });

    courses.push(course);
    tournaments.push(tournament);
  }

  // Create members and tour cards
  const members: Member[] = [];
  const tourCards: TourCard[] = [];

  for (let i = 0; i < 20; i++) {
    const member = createMockMember({
      id: `member-${i + 1}`,
      firstname: `Member`,
      lastname: `${i + 1}`,
      email: `member${i + 1}@example.com`,
    });

    // Each member gets tour cards for both tours
    tours.forEach((tour, tourIndex) => {
      const tourCard = createMockTourCard({
        id: `tourcard-${member.id}-${tour.id}`,
        displayName: `Member ${i + 1}`,
        memberId: member.id,
        tourId: tour.id,
        position: (i + tourIndex * 20 + 1).toString(),
      });
      tourCards.push(tourCard);
    });

    members.push(member);
  }

  return {
    season,
    tournaments,
    tours,
    tiers,
    courses,
    members,
    tourCards,
  };
}

// ============= TEST HELPERS =============

/**
 * Asserts that a tournament status is correctly calculated
 */
export function assertTournamentStatus(
  tournament: Tournament,
  expectedStatus: TournamentStatus,
  referenceDate: Date = new Date(),
): boolean {
  const actualStatus = getTournamentStatus(
    new Date(tournament.startDate),
    new Date(tournament.endDate),
    referenceDate,
  );
  return actualStatus === expectedStatus;
}

/**
 * Validates team scoring logic
 */
export function validateTeamScore(team: Team, golfers: Golfer[]): boolean {
  const teamGolfers = golfers.filter((g) => team.golferIds.includes(g.apiId));
  const calculatedScore = teamGolfers.reduce(
    (sum, golfer) => sum + (golfer.score || 0),
    0,
  );
  return Math.abs(calculatedScore - (team.score || 0)) < 0.01; // Allow for floating point precision
}

/**
 * Validates leaderboard position ordering
 */
export function validateLeaderboardOrder(teams: Team[]): boolean {
  for (let i = 1; i < teams.length; i++) {
    const prevTeam = teams[i - 1];
    const currentTeam = teams[i];

    if (!prevTeam || !currentTeam) continue;

    const prevScore = prevTeam.score || 0;
    const currentScore = currentTeam.score || 0;

    // Lower scores should come first (better in golf)
    if (prevScore > currentScore) {
      return false;
    }
  }
  return true;
}

/**
 * Creates a test environment with minimal setup
 */
export function createTestEnvironment() {
  const mockData = createMockLeaderboard(3);

  return {
    ...mockData,
    // Helper functions bound to this test data
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

/**
 * Performance testing helper - measures function execution time
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T,
  iterations: number = 1,
): { result: T; averageTime: number; totalTime: number } {
  const times: number[] = [];
  let result: T;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    result = fn();
    const end = performance.now();
    times.push(end - start);
  }

  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;

  console.log(`Performance Test: ${name}`);
  console.log(`Iterations: ${iterations}`);
  console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
  console.log(`Average Time: ${averageTime.toFixed(2)}ms`);

  return { result: result!, averageTime, totalTime };
}

/**
 * Mock API response builder for testing hooks
 */
export function createMockApiResponse<T>(
  data: T,
  delay: number = 0,
  shouldError: boolean = false,
): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldError) {
        reject(new Error("Mock API Error"));
      } else {
        resolve(data);
      }
    }, delay);
  });
}

/**
 * Date manipulation helpers for testing time-based logic
 */
export const testDateHelpers = {
  addDays: (date: Date, days: number): Date =>
    new Date(date.getTime() + days * 24 * 60 * 60 * 1000),

  subtractDays: (date: Date, days: number): Date =>
    new Date(date.getTime() - days * 24 * 60 * 60 * 1000),

  setTimeOfDay: (date: Date, hours: number, minutes: number = 0): Date => {
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  },

  isSameDay: (date1: Date, date2: Date): boolean =>
    date1.toDateString() === date2.toDateString(),
};

/**
 * Assertion helpers for common test scenarios
 */
export const testAssertions = {
  isValidScore: (score: number | null): boolean =>
    score === null ||
    (typeof score === "number" && !isNaN(score) && score >= -50 && score <= 50),

  isValidPosition: (position: string | null): boolean =>
    position === null || /^(T?\d+|CUT|WD|DQ)$/.test(position),

  isValidGolferId: (apiId: number): boolean =>
    typeof apiId === "number" && apiId > 0,

  hasRequiredTeamGolfers: (team: Team): boolean =>
    Array.isArray(team.golferIds) &&
    team.golferIds.length >= 4 &&
    team.golferIds.length <= 6,

  isValidMemberName: (member: Member): boolean =>
    (member.firstname !== null && member.firstname.length > 0) ||
    (member.lastname !== null && member.lastname.length > 0),

  isValidTourCard: (tourCard: TourCard): boolean =>
    tourCard.displayName.length > 0 &&
    tourCard.memberId.length > 0 &&
    tourCard.tourId.length > 0,
};
