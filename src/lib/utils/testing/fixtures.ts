/**
 * Testing Fixtures
 *
 * Collection of static test data, preset configurations, and reusable
 * test scenarios for golf tournament application testing.
 */

// ============= STATIC TEST DATA =============

/**
 * Standard tier payout structures for tournaments
 */
export const TIER_PAYOUTS = {
  major: [50000, 30000, 20000, 15000, 10000, 8000, 6000, 5000, 4000, 3000],
  regular: [25000, 15000, 10000, 7500, 5000, 4000, 3000, 2500, 2000, 1500],
  minor: [10000, 6000, 4000, 3000, 2000, 1500, 1000, 750, 500, 250],
} as const;

/**
 * Standard tier point structures for tournaments
 */
export const TIER_POINTS = {
  major: [500, 300, 200, 150, 100, 80, 60, 50, 40, 30],
  regular: [250, 150, 100, 75, 50, 40, 30, 25, 20, 15],
  minor: [100, 60, 40, 30, 20, 15, 10, 8, 6, 4],
} as const;

/**
 * Sample golfer API IDs for consistent testing
 */
export const SAMPLE_GOLFER_IDS = {
  team1: [123456, 123457, 123458, 123459],
  team2: [234567, 234568, 234569, 234570],
  team3: [345678, 345679, 345680, 345681],
  team4: [456789, 456790, 456791, 456792],
  team5: [567890, 567891, 567892, 567893],
} as const;

/**
 * Common golf course configurations
 */
export const COURSE_FIXTURES = {
  augusta: {
    name: "Augusta National Golf Club",
    location: "Augusta, Georgia",
    par: 72,
    front: 36,
    back: 36,
    timeZoneOffset: -5,
  },
  pebbleBeach: {
    name: "Pebble Beach Golf Links",
    location: "Pebble Beach, California",
    par: 72,
    front: 36,
    back: 36,
    timeZoneOffset: -8,
  },
  stAndrews: {
    name: "The Old Course at St Andrews",
    location: "St Andrews, Scotland",
    par: 72,
    front: 36,
    back: 36,
    timeZoneOffset: 0,
  },
} as const;

/**
 * Tournament tier configurations
 */
export const TIER_FIXTURES = {
  major: {
    name: "Major Championship",
    payouts: TIER_PAYOUTS.major,
    points: TIER_POINTS.major,
  },
  regular: {
    name: "Regular Tournament",
    payouts: TIER_PAYOUTS.regular,
    points: TIER_POINTS.regular,
  },
  minor: {
    name: "Minor Tournament",
    payouts: TIER_PAYOUTS.minor,
    points: TIER_POINTS.minor,
  },
} as const;

/**
 * Sample member names for testing
 */
export const SAMPLE_MEMBER_NAMES = [
  { firstname: "John", lastname: "Smith" },
  { firstname: "Jane", lastname: "Doe" },
  { firstname: "Michael", lastname: "Johnson" },
  { firstname: "Sarah", lastname: "Wilson" },
  { firstname: "David", lastname: "Brown" },
  { firstname: "Emily", lastname: "Davis" },
  { firstname: "Chris", lastname: "Miller" },
  { firstname: "Lisa", lastname: "Taylor" },
  { firstname: "Mark", lastname: "Anderson" },
  { firstname: "Amy", lastname: "Thomas" },
] as const;

/**
 * Sample professional golfer names for realistic testing
 */
export const SAMPLE_GOLFER_NAMES = [
  "Tiger Woods",
  "Scottie Scheffler",
  "Jon Rahm",
  "Rory McIlroy",
  "Patrick Cantlay",
  "Xander Schauffele",
  "Dustin Johnson",
  "Justin Thomas",
  "Jordan Spieth",
  "Brooks Koepka",
  "Collin Morikawa",
  "Bryson DeChambeau",
  "Tony Finau",
  "Hideki Matsuyama",
  "Viktor Hovland",
] as const;

/**
 * Sample course names for testing
 */
export const SAMPLE_COURSE_NAMES = [
  "Augusta National Golf Club",
  "Pebble Beach Golf Links",
  "St Andrews Old Course",
  "Pinehurst No. 2",
  "Bethpage Black",
  "TPC Sawgrass",
  "Royal Birkdale",
  "Oakmont Country Club",
  "Winged Foot Golf Club",
  "Congressional Country Club",
] as const;

// ============= PRESET CONFIGURATIONS =============

/**
 * Standard tournament date ranges for testing
 */
export const TOURNAMENT_DATE_PRESETS = {
  masters: {
    startDate: new Date("2024-04-11"),
    endDate: new Date("2024-04-14"),
  },
  usOpen: {
    startDate: new Date("2024-06-13"),
    endDate: new Date("2024-06-16"),
  },
  openChampionship: {
    startDate: new Date("2024-07-18"),
    endDate: new Date("2024-07-21"),
  },
  pgaChampionship: {
    startDate: new Date("2024-05-16"),
    endDate: new Date("2024-05-19"),
  },
} as const;

/**
 * Common score ranges for different skill levels
 */
export const SCORE_PRESETS = {
  elite: { min: -15, max: -8 },
  professional: { min: -12, max: -2 },
  competitive: { min: -8, max: 2 },
  recreational: { min: -2, max: 8 },
} as const;

/**
 * Standard playoff configurations
 */
export const PLAYOFF_PRESETS = {
  pga: [8, 4], // 8 gold spots, 4 silver spots
  euro: [6, 3], // 6 gold spots, 3 silver spots
  korn: [4, 2], // 4 gold spots, 2 silver spots
} as const;

// ============= TEST SCENARIO FIXTURES =============

/**
 * Pre-built test scenarios for common use cases
 */
export const TEST_SCENARIOS = {
  /**
   * Small tournament scenario (5 teams)
   */
  smallTournament: {
    teamCount: 5,
    tier: TIER_FIXTURES.regular,
    course: COURSE_FIXTURES.augusta,
    dates: TOURNAMENT_DATE_PRESETS.masters,
  },

  /**
   * Large tournament scenario (20 teams)
   */
  largeTournament: {
    teamCount: 20,
    tier: TIER_FIXTURES.major,
    course: COURSE_FIXTURES.pebbleBeach,
    dates: TOURNAMENT_DATE_PRESETS.usOpen,
  },

  /**
   * Season-long scenario (10 tournaments)
   */
  fullSeason: {
    tournamentCount: 10,
    memberCount: 20,
    tours: ["PGA", "European"],
    tiers: [TIER_FIXTURES.major, TIER_FIXTURES.regular],
  },

  /**
   * Weekend recreational tournament
   */
  weekendTournament: {
    teamCount: 8,
    tier: TIER_FIXTURES.minor,
    course: COURSE_FIXTURES.stAndrews,
    scoreRange: SCORE_PRESETS.recreational,
  },
} as const;

// ============= DATE FIXTURES =============

/**
 * Common test dates for consistent testing
 */
export const TEST_DATES = {
  seasonStart: new Date("2024-01-01"),
  seasonEnd: new Date("2024-12-31"),
  currentDate: new Date("2024-06-15"),
  pastDate: new Date("2024-01-15"),
  futureDate: new Date("2024-12-15"),
  tournamentStart: new Date("2024-06-13"),
  tournamentEnd: new Date("2024-06-16"),
} as const;

/**
 * Time zone offsets for testing international tournaments
 */
export const TIMEZONE_OFFSETS = {
  eastern: -5,
  central: -6,
  mountain: -7,
  pacific: -8,
  utc: 0,
  british: 0,
  central_european: 1,
  japan: 9,
} as const;

// ============= VALIDATION FIXTURES =============

/**
 * Valid position formats for testing
 */
export const VALID_POSITIONS = [
  "1",
  "2",
  "3",
  "T4",
  "T5",
  "T10",
  "15",
  "T20",
  "CUT",
  "WD",
  "DQ",
] as const;

/**
 * Invalid position formats for negative testing
 */
export const INVALID_POSITIONS = [
  "",
  "0",
  "-1",
  "T",
  "T0",
  "INVALID",
  "999",
] as const;

/**
 * Valid golf score ranges for testing
 */
export const VALID_SCORES = [-25, -15, -10, -5, 0, 5, 10, 15, 20] as const;

/**
 * Invalid golf scores for negative testing
 */
export const INVALID_SCORES = [-100, 100, NaN, Infinity, -Infinity] as const;

// ============= PERFORMANCE TEST FIXTURES =============

/**
 * Data sizes for performance testing
 */
export const PERFORMANCE_TEST_SIZES = {
  small: { teams: 10, golfers: 40, tournaments: 5 },
  medium: { teams: 50, golfers: 200, tournaments: 20 },
  large: { teams: 100, golfers: 400, tournaments: 50 },
  extraLarge: { teams: 500, golfers: 2000, tournaments: 100 },
} as const;

/**
 * Performance benchmarks (in milliseconds)
 */
export const PERFORMANCE_BENCHMARKS = {
  sorting: {
    small: 10,
    medium: 50,
    large: 200,
  },
  filtering: {
    small: 5,
    medium: 25,
    large: 100,
  },
  aggregation: {
    small: 15,
    medium: 75,
    large: 300,
  },
} as const;

// ============= EXPORT COLLECTIONS =============

/**
 * All tier-related fixtures
 */
export const TIER_FIXTURES_ALL = {
  payouts: TIER_PAYOUTS,
  points: TIER_POINTS,
  configs: TIER_FIXTURES,
} as const;

/**
 * All sample data collections
 */
export const SAMPLE_DATA = {
  golferIds: SAMPLE_GOLFER_IDS,
  memberNames: SAMPLE_MEMBER_NAMES,
  golferNames: SAMPLE_GOLFER_NAMES,
  courseNames: SAMPLE_COURSE_NAMES,
} as const;

/**
 * All preset configurations
 */
export const PRESETS = {
  tournaments: TOURNAMENT_DATE_PRESETS,
  scores: SCORE_PRESETS,
  playoffs: PLAYOFF_PRESETS,
  timezones: TIMEZONE_OFFSETS,
} as const;

/**
 * All validation test data
 */
export const VALIDATION_DATA = {
  validPositions: VALID_POSITIONS,
  invalidPositions: INVALID_POSITIONS,
  validScores: VALID_SCORES,
  invalidScores: INVALID_SCORES,
} as const;
