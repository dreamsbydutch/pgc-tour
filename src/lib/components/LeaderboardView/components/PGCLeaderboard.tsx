/**
 * PGCLeaderboard - Displays PGC teams leaderboard
 */

import React from "react";
import { LeaderboardListing } from "./LeaderboardListing";
import { sortTeams } from "../utils";
import type {
  TeamWithTourCard,
  LeaderboardGolfer,
  LeaderboardTournament,
  LeaderboardTourCard,
  LeaderboardMember,
} from "../types";

interface PGCLeaderboardProps {
  teams: TeamWithTourCard[];
  golfers: LeaderboardGolfer[];
  tournament: LeaderboardTournament;
  tourCard?: LeaderboardTourCard | null;
  member?: LeaderboardMember | null;
  activeTour: string;
  variant: "regular" | "playoff";
}

export const PGCLeaderboard: React.FC<PGCLeaderboardProps> = ({
  teams,
  golfers,
  tournament,
  tourCard,
  member,
  activeTour,
  variant,
}) => {
  const getFilteredTeams = () => {
    const sortedTeams = sortTeams(teams ?? []) as TeamWithTourCard[];

    if (variant === "playoff") {
      const playoffLevel =
        activeTour === "gold" ? 1 : activeTour === "silver" ? 2 : 1;
      return sortedTeams.filter(
        (team) => team.tourCard?.playoff === playoffLevel,
      );
    }

    return sortedTeams.filter((team) => team.tourCard?.tourId === activeTour);
  };

  const filteredTeams = getFilteredTeams();

  return (
    <>
      {filteredTeams.map((team) => {
        if (!team.tourCard || !tourCard || !member) return null;

        return (
          <LeaderboardListing
            key={team.id}
            type="PGC"
            tournament={tournament}
            tournamentGolfers={golfers}
            tourCard={team.tourCard}
            userTourCard={tourCard}
            team={team}
            member={member}
          />
        );
      })}
    </>
  );
};
