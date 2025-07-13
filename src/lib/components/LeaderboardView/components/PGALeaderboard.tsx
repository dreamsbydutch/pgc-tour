/**
 * PGALeaderboard - Displays PGA golfers leaderboard
 */

import React from "react";
import { LeaderboardListing } from "./LeaderboardListing";
import { sortGolfers } from "../utils";
import type {
  LeaderboardGolfer,
  LeaderboardTournament,
  LeaderboardTourCard,
} from "../utils/types";

interface PGALeaderboardProps {
  golfers: LeaderboardGolfer[];
  tournament: LeaderboardTournament;
  tourCard?: LeaderboardTourCard | null;
}

export const PGALeaderboard: React.FC<PGALeaderboardProps> = ({
  golfers,
  tournament,
  tourCard,
}) => {
  // Create simplified golfers for sorting, keeping the id
  const golfersForSorting = golfers.map((golfer) => ({
    id: golfer.id,
    position: golfer.position ?? "CUT",
    score: golfer.score ?? 999,
  }));

  const sortedGolfers = sortGolfers(golfersForSorting);

  return (
    <>
      {sortedGolfers.map((sortedGolfer) => {
        if (!tourCard) return null;

        // Find the original golfer to get the full data
        const originalGolfer = golfers.find((g) => g.id === sortedGolfer.id);
        if (!originalGolfer) return null;

        return (
          <LeaderboardListing
            key={originalGolfer.id}
            type="PGA"
            tournament={tournament}
            tournamentGolfers={golfers}
            userTourCard={{ id: tourCard.id }}
            golfer={originalGolfer}
          />
        );
      })}
    </>
  );
};
