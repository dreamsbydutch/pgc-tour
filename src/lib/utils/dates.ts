/**
 * @fileoverview Date and time utilities for tournament management
 * Provides comprehensive date manipulation and tournament timeline functions
 */

/**
 * Configuration options for tournament timeline filtering
 */
export interface TournamentTimelineConfig {
  /** Buffer days before tournament start to consider it "current" */
  preStartBuffer?: number;
  /** Buffer days after tournament end to consider it "current" */
  postEndBuffer?: number;
  /** Buffer days after end to still consider it "previous" */
  previousBuffer?: number;
  /** Buffer days before start to consider it "upcoming" */
  upcomingBuffer?: number;
}

/**
 * Tournament timeline result containing categorized tournaments
 */
export interface TournamentTimeline<T> {
  /** All tournaments sorted by start date */
  allSorted: T[];
  /** Currently active tournament (within buffer range) */
  current: T | null;
  /** Previous tournament (within buffer range) */
  previous: T | null;
  /** Next upcoming tournament (within buffer range) */
  upcoming: T | null;
  /** All past tournaments */
  past: T[];
  /** All future tournaments */
  future: T[];
  /** Tournaments happening this week */
  thisWeek: T[];
  /** Tournaments happening this month */
  thisMonth: T[];
}

/**
 * Subtracts time from a date with various units
 * @param options - Configuration for time subtraction
 * @returns New date with time subtracted
 * @example
 * subtractTimeFromDate({ date: new Date(), daysToSubtract: 7 }) // 7 days ago
 */
export function subtractTimeFromDate({
  date,
  weeksToSubtract = 0,
  daysToSubtract = 0,
  hoursToSubtract = 0,
  minutesToSubtract = 0,
}: {
  date: Date;
  weeksToSubtract?: number;
  daysToSubtract?: number;
  hoursToSubtract?: number;
  minutesToSubtract?: number;
}): Date {
  const timeToSubtract =
    (weeksToSubtract * 7 + daysToSubtract) * 24 * 60 * 60 * 1000 +
    hoursToSubtract * 60 * 60 * 1000 +
    minutesToSubtract * 60 * 1000;

  const pastDate = new Date(date);
  pastDate.setTime(pastDate.getTime() - timeToSubtract);
  return pastDate;
}

/**
 * Adds time to a date with various units
 * @param options - Configuration for time addition
 * @returns New date with time added
 * @example
 * addTimeToDate({ date: new Date(), daysToAdd: 7 }) // 7 days from now
 */
export function addTimeToDate({
  date,
  weeksToAdd = 0,
  daysToAdd = 0,
  hoursToAdd = 0,
  minutesToAdd = 0,
}: {
  date: Date;
  weeksToAdd?: number;
  daysToAdd?: number;
  hoursToAdd?: number;
  minutesToAdd?: number;
}): Date {
  const timeToAdd =
    (weeksToAdd * 7 + daysToAdd) * 24 * 60 * 60 * 1000 +
    hoursToAdd * 60 * 60 * 1000 +
    minutesToAdd * 60 * 1000;

  const futureDate = new Date(date);
  futureDate.setTime(futureDate.getTime() + timeToAdd);
  return futureDate;
}

/**
 * Gets the start of day for a given date
 * @param date - Date to get start of day for
 * @returns New date at start of day (00:00:00)
 * @example
 * getStartOfDay(new Date()) // Today at midnight
 */
export function getStartOfDay(date: Date): Date {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

/**
 * Gets the end of day for a given date
 * @param date - Date to get end of day for
 * @returns New date at end of day (23:59:59.999)
 * @example
 * getEndOfDay(new Date()) // Today at 11:59:59 PM
 */
export function getEndOfDay(date: Date): Date {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * Checks if two dates are on the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if dates are on the same day
 * @example
 * isSameDay(new Date(), new Date()) // true
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Gets the number of days between two dates
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of days between dates (can be negative)
 * @example
 * getDaysBetween(new Date('2025-01-01'), new Date('2025-01-08')) // 7
 */
export function getDaysBetween(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
}

/**
 * Comprehensive tournament date utilities for sorting and filtering
 * @param tournaments - Array of tournament objects with startDate and endDate
 * @param config - Configuration for buffer times and filtering
 * @param referenceDate - Reference date for calculations (defaults to now)
 * @returns Comprehensive tournament timeline data
 * @example
 * const timeline = getTournamentTimeline(tournaments, { preStartBuffer: 3 });
 * console.log(timeline.current); // Current tournament
 */
export function getTournamentTimeline<
  T extends { startDate: Date; endDate: Date },
>(
  tournaments: T[],
  config: TournamentTimelineConfig = {},
  referenceDate: Date = new Date(),
): TournamentTimeline<T> {
  const {
    preStartBuffer = 3,
    postEndBuffer = 1,
    previousBuffer = 3,
    upcomingBuffer = 3,
  } = config;

  // Sort all tournaments by start date
  const allSorted = [...tournaments].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime(),
  );

  const now = referenceDate.getTime();

  // Helper functions for date comparisons
  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const subtractDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  };

  // Find current tournament (within pre/post buffers)
  const current =
    allSorted.find((tournament) => {
      const adjustedStart = subtractDays(tournament.startDate, preStartBuffer);
      const adjustedEnd = addDays(tournament.endDate, postEndBuffer);
      return now >= adjustedStart.getTime() && now <= adjustedEnd.getTime();
    }) || null;

  // Find previous tournament (most recent ended tournament within buffer)
  const previous =
    allSorted
      .filter((tournament) => {
        if (current && tournament === current) return false; // Don't include current
        const bufferEnd = addDays(tournament.endDate, previousBuffer);
        return tournament.endDate.getTime() < now && now <= bufferEnd.getTime();
      })
      .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0] || null;

  // Find upcoming tournament (next tournament within buffer)
  const upcoming =
    allSorted
      .filter((tournament) => {
        if (current && tournament === current) return false; // Don't include current
        const bufferStart = subtractDays(tournament.startDate, upcomingBuffer);
        return (
          tournament.startDate.getTime() > now && now >= bufferStart.getTime()
        );
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0] || null;

  // Categorize all tournaments
  const past = allSorted.filter(
    (tournament) => tournament.endDate.getTime() < now,
  );
  const future = allSorted.filter(
    (tournament) => tournament.startDate.getTime() > now,
  );

  // This week (within 7 days)
  const weekStart = subtractDays(referenceDate, 7);
  const weekEnd = addDays(referenceDate, 7);
  const thisWeek = allSorted.filter(
    (tournament) =>
      tournament.startDate.getTime() >= weekStart.getTime() &&
      tournament.startDate.getTime() <= weekEnd.getTime(),
  );

  // This month
  const monthStart = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    1,
  );
  const monthEnd = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth() + 1,
    0,
  );
  const thisMonth = allSorted.filter(
    (tournament) =>
      tournament.startDate.getTime() >= monthStart.getTime() &&
      tournament.startDate.getTime() <= monthEnd.getTime(),
  );

  return {
    allSorted,
    current,
    previous,
    upcoming,
    past,
    future,
    thisWeek,
    thisMonth,
  };
}

/**
 * Quick utility functions for common tournament queries
 */
export const tournamentUtils = {
  /**
   * Get current tournament with custom buffers
   * @example
   * const current = tournamentUtils.getCurrent(tournaments, 3, 1);
   */
  getCurrent: <T extends { startDate: Date; endDate: Date }>(
    tournaments: T[],
    preBuffer = 3,
    postBuffer = 1,
    referenceDate = new Date(),
  ) => {
    return getTournamentTimeline(
      tournaments,
      {
        preStartBuffer: preBuffer,
        postEndBuffer: postBuffer,
      },
      referenceDate,
    ).current;
  },

  /**
   * Get previous tournament with custom buffer
   * @example
   * const previous = tournamentUtils.getPrevious(tournaments, 3);
   */
  getPrevious: <T extends { startDate: Date; endDate: Date }>(
    tournaments: T[],
    bufferDays = 3,
    referenceDate = new Date(),
  ) => {
    return getTournamentTimeline(
      tournaments,
      {
        previousBuffer: bufferDays,
      },
      referenceDate,
    ).previous;
  },

  /**
   * Get upcoming tournament with custom buffer
   * @example
   * const upcoming = tournamentUtils.getUpcoming(tournaments, 3);
   */
  getUpcoming: <T extends { startDate: Date; endDate: Date }>(
    tournaments: T[],
    bufferDays = 3,
    referenceDate = new Date(),
  ) => {
    return getTournamentTimeline(
      tournaments,
      {
        upcomingBuffer: bufferDays,
      },
      referenceDate,
    ).upcoming;
  },

  /**
   * Sort tournaments by start date
   * @example
   * const sorted = tournamentUtils.sortByStartDate(tournaments);
   */
  sortByStartDate: <T extends { startDate: Date; endDate: Date }>(
    tournaments: T[],
  ) => {
    return [...tournaments].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime(),
    );
  },

  /**
   * Sort tournaments by end date
   * @example
   * const sorted = tournamentUtils.sortByEndDate(tournaments);
   */
  sortByEndDate: <T extends { startDate: Date; endDate: Date }>(
    tournaments: T[],
  ) => {
    return [...tournaments].sort(
      (a, b) => a.endDate.getTime() - b.endDate.getTime(),
    );
  },

  /**
   * Check if tournament is currently active (during tournament dates)
   * @example
   * const isActive = tournamentUtils.isActive(tournament);
   */
  isActive: <T extends { startDate: Date; endDate: Date }>(
    tournament: T,
    referenceDate = new Date(),
  ) => {
    const now = referenceDate.getTime();
    return (
      now >= tournament.startDate.getTime() &&
      now <= tournament.endDate.getTime()
    );
  },

  /**
   * Check if tournament is within a custom date range
   * @example
   * const inRange = tournamentUtils.isWithinRange(tournament, startDate, endDate);
   */
  isWithinRange: <T extends { startDate: Date; endDate: Date }>(
    tournament: T,
    startRange: Date,
    endRange: Date,
  ) => {
    return (
      tournament.startDate.getTime() >= startRange.getTime() &&
      tournament.endDate.getTime() <= endRange.getTime()
    );
  },

  /**
   * Get tournaments for a specific season/year
   * @example
   * const tournaments2025 = tournamentUtils.getByYear(tournaments, 2025);
   */
  getByYear: <T extends { startDate: Date; endDate: Date }>(
    tournaments: T[],
    year: number,
  ) => {
    return tournaments.filter(
      (tournament) => tournament.startDate.getFullYear() === year,
    );
  },

  /**
   * Get tournaments within date range
   * @example
   * const tournaments = tournamentUtils.getInDateRange(allTournaments, startDate, endDate);
   */
  getInDateRange: <T extends { startDate: Date; endDate: Date }>(
    tournaments: T[],
    startDate: Date,
    endDate: Date,
  ) => {
    return tournaments.filter(
      (tournament) =>
        tournament.startDate.getTime() >= startDate.getTime() &&
        tournament.startDate.getTime() <= endDate.getTime(),
    );
  },
};
