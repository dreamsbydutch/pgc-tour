/**
 * Tee time calculation functions
 */

import type { Golfer, Team } from "@prisma/client";
import type { TeeTimeKey } from "./types";

/**
 * Updates tee times for all rounds
 */
export function updateTeeTimes(team: Team, golfers: Golfer[]): void {
  team.roundOneTeeTime =
    getEarliestTeeTime(golfers, "roundOneTeeTime") ?? team.roundOneTeeTime;
  team.roundTwoTeeTime =
    getEarliestTeeTime(golfers, "roundTwoTeeTime") ?? team.roundTwoTeeTime;
  team.roundThreeTeeTime =
    getFifthLatestTeeTime(golfers, "roundThreeTeeTime") ??
    team.roundThreeTeeTime;
  team.roundFourTeeTime =
    getFifthLatestTeeTime(golfers, "roundFourTeeTime") ?? team.roundFourTeeTime;
}

/**
 * Gets the earliest tee time from golfers
 */
function getEarliestTeeTime(
  golfers: Golfer[],
  teeTimeKey: TeeTimeKey,
): string | null {
  const validTimes = golfers
    .map((g) => g[teeTimeKey])
    .filter((time): time is string => time !== null)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return validTimes[0] ?? null;
}

/**
 * Gets the 5th latest tee time from golfers (for rounds 3-4)
 */
function getFifthLatestTeeTime(
  golfers: Golfer[],
  teeTimeKey: TeeTimeKey,
): string | null {
  const validTimes = golfers
    .map((g) => g[teeTimeKey])
    .filter((time): time is string => time !== null)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const index = Math.min(4, validTimes.length - 1);
  return validTimes[index] ?? null;
}
