/**
 * PGALeaderboard - Displays PGA golfers leaderboard
 */

import React from "react";
import { LeaderboardListing } from "./LeaderboardListing";
import { sortGolfers } from "../utils";
import type { Golfer, Tournament, TourCard } from "../types";

interface PGALeaderboardProps {
  golfers: Golfer[];
  tournament: Tournament;
  tourCard?: TourCard | null;
}

export const PGALeaderboard: React.FC<PGALeaderboardProps> = ({
  golfers,
  tournament,
  tourCard,
}) => {
  const sortedGolfers = sortGolfers(golfers ?? []);

  return (
    <>
      {sortedGolfers.map((golfer) => (
        <LeaderboardListing
          key={golfer.id}
          type="PGA"
          tournament={tournament}
          tournamentGolfers={golfers}
          userTourCard={tourCard}
          golfer={golfer}
        />
      ))}
    </>
  );
};
