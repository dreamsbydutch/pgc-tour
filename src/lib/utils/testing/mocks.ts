/**
 * @fileoverview Mock data generators for testing golf tournament applications
 * Provides realistic mock data for all major entities in the golf tournament system
 */

// Import types - these would typically come from your types folder
// For now, using Prisma client types as reference
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

// ============================================================================
// INDIVIDUAL MOCK GENERATORS
// ============================================================================

/**
 * Generates a mock course with realistic golf course data
 * Extracted from old-utils/test.ts
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
 * Extracted from old-utils/test.ts
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
 * Extracted from old-utils/test.ts
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
 * Extracted from old-utils/test.ts
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
 * Extracted from old-utils/test.ts
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
 * Extracted from old-utils/test.ts
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
 * Extracted from old-utils/test.ts
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
 * Extracted from old-utils/test.ts
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
 * Extracted from old-utils/test.ts
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

// ============================================================================
// COMPLEX MOCK SCENARIOS
// ============================================================================

/**
 * Creates a complete tournament leaderboard scenario
 * Extracted from old-utils/test.ts
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
 * Extracted from old-utils/test.ts
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

/**
 * Creates a test environment with minimal setup
 * Extracted from old-utils/test.ts
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
 * Mock API response builder for testing hooks
 * Extracted from old-utils/test.ts
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

// ============================================================================
// RANDOMIZED MOCK GENERATORS
// ============================================================================

/**
 * Generate random golfer names for more realistic testing
 */
export function generateRandomGolferName(): string {
  const firstNames = [
    "Tiger",
    "Jordan",
    "Rory",
    "Justin",
    "Brooks",
    "Dustin",
    "Phil",
    "Adam",
    "Jason",
    "Tony",
    "Rickie",
    "Bubba",
    "Matt",
    "Sergio",
    "Ian",
    "Patrick",
  ];
  const lastNames = [
    "Woods",
    "Spieth",
    "McIlroy",
    "Thomas",
    "Koepka",
    "Johnson",
    "Mickelson",
    "Scott",
    "Day",
    "Finau",
    "Fowler",
    "Watson",
    "Kuchar",
    "Garcia",
    "Poulter",
    "Reed",
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
}

/**
 * Generate random golf course names
 */
export function generateRandomCourseName(): string {
  const prefixes = [
    "Augusta",
    "Pebble",
    "St. Andrews",
    "Torrey",
    "TPC",
    "Congressional",
    "Bethpage",
    "Riviera",
    "Whistling",
    "Oak",
    "Pine",
    "Magnolia",
    "Royal",
    "Cherry",
    "Oakmont",
  ];
  const suffixes = [
    "National",
    "Beach",
    "Links",
    "Country Club",
    "Golf Club",
    "Resort",
    "Hills",
    "Valley",
    "Ridge",
    "Course",
    "Green",
    "Pines",
    "Oaks",
    "Fields",
    "Meadows",
  ];

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

  return `${prefix} ${suffix}`;
}

/**
 * Generate random realistic golf scores
 */
export function generateRandomGolfScore(par: number = 72): number {
  // Most scores range from -15 to +10 relative to par
  const minScore = par - 15;
  const maxScore = par + 10;

  // Weight towards more realistic scores (closer to par)
  const randomFactor = Math.random() + Math.random() + Math.random(); // Sum of 3 random numbers for bell curve
  const normalizedFactor = (randomFactor - 1.5) / 1.5; // Normalize to -1 to 1 range

  const score = Math.round(par + normalizedFactor * 8); // +/- 8 strokes from par typically

  return Math.max(minScore, Math.min(maxScore, score));
}

/**
 * Create a randomized mock tournament with realistic data
 */
export function createRandomMockTournament(
  overrides?: Partial<Tournament>,
): Tournament {
  const courseName = generateRandomCourseName();
  const locations = [
    "Augusta, GA",
    "Pebble Beach, CA",
    "St. Andrews, Scotland",
    "Torrey Pines, CA",
    "Bethpage, NY",
    "Riviera, CA",
    "Whistling Straits, WI",
    "Congressional, MD",
  ];

  const startDate = new Date(
    2024,
    Math.floor(Math.random() * 12),
    Math.floor(Math.random() * 28) + 1,
  );
  const endDate = new Date(startDate.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days

  return createMockTournament({
    name: `${courseName} Championship`,
    startDate,
    endDate,
    currentRound: Math.floor(Math.random() * 4) + 1,
    livePlay: Math.random() > 0.5,
    ...overrides,
  });
}
