// Tournament timeline and complex date operations
// Extracted from old-utils/dates.ts - only high-value, golf-specific logic

export interface TournamentTimelineConfig {
  preStartBuffer?: number;
  postEndBuffer?: number;
  previousBuffer?: number;
  upcomingBuffer?: number;
}

export interface TournamentTimeline<T> {
  allSorted: T[];
  current: T | null;
  previous: T | null;
  upcoming: T | null;
  past: T[];
  future: T[];
  thisWeek: T[];
  thisMonth: T[];
}

/**
 * Tournament-specific date operations that provide clear business value
 * Focuses on complex tournament timeline logic unique to golf applications
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

export function getDaysBetween(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
}

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

  const allSorted = [...tournaments].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime(),
  );

  const now = referenceDate.getTime();

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

  const current =
    allSorted.find((tournament) => {
      const adjustedStart = subtractDays(tournament.startDate, preStartBuffer);
      const adjustedEnd = addDays(tournament.endDate, postEndBuffer);
      return now >= adjustedStart.getTime() && now <= adjustedEnd.getTime();
    }) || null;

  const previous =
    allSorted
      .filter((tournament) => {
        if (current && tournament === current) return false;
        const bufferEnd = addDays(tournament.endDate, previousBuffer);
        return tournament.endDate.getTime() < now && now <= bufferEnd.getTime();
      })
      .sort((a, b) => b.endDate.getTime() - a.endDate.getTime())[0] || null;

  const upcoming =
    allSorted
      .filter((tournament) => {
        if (current && tournament === current) return false;
        const bufferStart = subtractDays(tournament.startDate, upcomingBuffer);
        return (
          tournament.startDate.getTime() > now && now >= bufferStart.getTime()
        );
      })
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0] || null;

  const past = allSorted.filter(
    (tournament) => tournament.endDate.getTime() < now,
  );
  const future = allSorted.filter(
    (tournament) => tournament.startDate.getTime() > now,
  );

  const weekStart = subtractDays(referenceDate, 7);
  const weekEnd = addDays(referenceDate, 7);
  const thisWeek = allSorted.filter(
    (tournament) =>
      tournament.startDate.getTime() >= weekStart.getTime() &&
      tournament.startDate.getTime() <= weekEnd.getTime(),
  );

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

export function getCurrentTournament<
  T extends { startDate: Date; endDate: Date },
>(
  tournaments: T[],
  preBuffer = 3,
  postBuffer = 1,
  referenceDate = new Date(),
): T | null {
  return getTournamentTimeline(
    tournaments,
    {
      preStartBuffer: preBuffer,
      postEndBuffer: postBuffer,
    },
    referenceDate,
  ).current;
}

export function getPreviousTournament<
  T extends { startDate: Date; endDate: Date },
>(tournaments: T[], bufferDays = 3, referenceDate = new Date()): T | null {
  return getTournamentTimeline(
    tournaments,
    {
      previousBuffer: bufferDays,
    },
    referenceDate,
  ).previous;
}

export function getUpcomingTournament<
  T extends { startDate: Date; endDate: Date },
>(tournaments: T[], bufferDays = 3, referenceDate = new Date()): T | null {
  return getTournamentTimeline(
    tournaments,
    {
      upcomingBuffer: bufferDays,
    },
    referenceDate,
  ).upcoming;
}

export function sortTournamentsByStartDate<
  T extends { startDate: Date; endDate: Date },
>(tournaments: T[]): T[] {
  return [...tournaments].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime(),
  );
}

export function isTournamentActive<
  T extends { startDate: Date; endDate: Date },
>(tournament: T, referenceDate = new Date()): boolean {
  const now = referenceDate.getTime();
  return (
    now >= tournament.startDate.getTime() && now <= tournament.endDate.getTime()
  );
}

export function getTournamentsByYear<
  T extends { startDate: Date; endDate: Date },
>(tournaments: T[], year: number): T[] {
  return tournaments.filter(
    (tournament) => tournament.startDate.getFullYear() === year,
  );
}

export function getTournamentsInDateRange<
  T extends { startDate: Date; endDate: Date },
>(tournaments: T[], startDate: Date, endDate: Date): T[] {
  return tournaments.filter(
    (tournament) =>
      tournament.startDate.getTime() >= startDate.getTime() &&
      tournament.startDate.getTime() <= endDate.getTime(),
  );
}
