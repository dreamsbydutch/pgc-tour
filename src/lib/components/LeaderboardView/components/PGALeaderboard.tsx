/**
 * PGALeaderboard - Displays PGA golfers leaderboard
 */

import React from "react";
import { LeaderboardListing } from "./LeaderboardListing";
import { sortGolfers } from "../utils";
import { Golfer, TourCard, Tournament } from "@prisma/client";
import type {
  LeaderboardGolfer,
  LeaderboardTournament,
  TournamentGolfer,
} from "../utils/types";

interface PGALeaderboardProps {
  golfers: Golfer[];
  tournament: Tournament;
  tourCard?: TourCard | null;
}

// Helper functions to map Prisma types to Leaderboard types
const mapToTournamentGolfers = (golfers: Golfer[]): TournamentGolfer[] => {
  return golfers.map((golfer) => ({
    id: golfer.id,
    apiId: golfer.apiId ?? 0,
    position: golfer.position ?? "CUT",
    playerName: golfer.playerName ?? "Unknown",
    today: golfer.today ?? 0,
    thru: golfer.thru ?? 0,
    score: golfer.score ?? 0,
    group: golfer.group ?? 0,
    roundOne: golfer.roundOne,
    roundTwo: golfer.roundTwo,
    roundThree: golfer.roundThree,
    roundFour: golfer.roundFour,
    makeCut: golfer.makeCut,
    usage: golfer.usage,
  }));
};

const mapToLeaderboardGolfer = (golfer: Golfer): LeaderboardGolfer => ({
  apiId: golfer.apiId ?? 0,
  position: golfer.position ?? "CUT",
  posChange: golfer.posChange ?? 0,
  playerName: golfer.playerName ?? "Unknown",
  score: golfer.score ?? 0,
  today: golfer.today ?? 0,
  thru: golfer.thru ?? 0,
  group: golfer.group ?? 0,
  roundOne: golfer.roundOne,
  roundTwo: golfer.roundTwo,
  roundThree: golfer.roundThree,
  roundFour: golfer.roundFour,
  round: golfer.round,
  rating: golfer.rating ?? 0,
  endHole: golfer.endHole ?? 0,
  usage: golfer.usage ?? 0,
  makeCut: golfer.makeCut ?? 0,
  topTen: golfer.topTen ?? 0,
  country: golfer.country ?? "USA",
  win: golfer.win ?? 0,
  worldRank: golfer.worldRank ?? 0,
});

const mapToLeaderboardTournament = (
  tournament: Tournament,
): LeaderboardTournament => ({
  currentRound: tournament.currentRound ?? 1,
});

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
  const mappedTournamentGolfers = mapToTournamentGolfers(golfers);
  const mappedTournament = mapToLeaderboardTournament(tournament);

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
            tournament={mappedTournament}
            tournamentGolfers={mappedTournamentGolfers}
            userTourCard={{ id: tourCard.id }}
            golfer={mapToLeaderboardGolfer(originalGolfer)}
          />
        );
      })}
    </>
  );
};
