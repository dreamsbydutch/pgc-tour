/**
 * PGALeaderboard - Displays PGA golfers leaderboard
 *
 * This component renders the leaderboard for PGA Tour golfers.
 * It sorts golfers by their position/score and renders each one
 * using the LeaderboardListing component.
 *
 * @param golfers - Array of all golfers in the tournament
 * @param tournament - Tournament details
 * @param tourCard - Current user's tour card (for highlighting golfers on their team)
 * @param isPreTournament - Whether tournament hasn't started yet
 */

import React from "react";
import { LeaderboardListing } from "./LeaderboardListing";
import { sortGolfers } from "../utils";
import type {
  LeaderboardGolfer,
  LeaderboardTournament,
  LeaderboardTourCard,
} from "../utils/types";

/**
 * Props for PGALeaderboard component
 */
interface PGALeaderboardProps {
  /** All golfers in the tournament */
  golfers: LeaderboardGolfer[];
  /** Tournament information */
  tournament: LeaderboardTournament;
  /** Current user's tour card for highlighting */
  tourCard?: LeaderboardTourCard | null;
  /** Whether tournament hasn't started yet */
  isPreTournament?: boolean;
}

/**
 * PGA Leaderboard Component
 *
 * Renders a sorted list of PGA Tour golfers. The sorting takes into account
 * position, score, and special statuses like cuts, withdrawals, and disqualifications.
 */
export const PGALeaderboard: React.FC<PGALeaderboardProps> = ({
  golfers,
  tournament,
  tourCard,
  isPreTournament = false,
}) => {
  // Create simplified golfers for sorting while preserving the original id
  const golfersForSorting = golfers.map((golfer) => ({
    id: golfer.id,
    position: golfer.position ?? "CUT",
    score: golfer.score ?? 999,
    group: golfer.group ?? null,
  }));

  // Sort golfers using the utility function
  const sortedGolfers = sortGolfers(golfersForSorting);

  return (
    <>
      {sortedGolfers.map((sortedGolfer) => {
        // Find the original golfer to get the full data
        const originalGolfer = golfers.find((g) => g.id === sortedGolfer.id);
        if (!originalGolfer) return null;

        return (
          <LeaderboardListing
            key={originalGolfer.id}
            type="PGA"
            tournament={tournament}
            tournamentGolfers={golfers}
            userTourCard={tourCard && { id: tourCard?.id }}
            golfer={originalGolfer}
            isPreTournament={isPreTournament}
          />
        );
      })}
    </>
  );
};
