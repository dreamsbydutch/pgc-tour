/**
 * PGCLeaderboard - Displays PGC teams leaderboard
 */

import React from "react";
import { LeaderboardListing } from "./LeaderboardListing";
import { sortTeams } from "../utils";
import type {
  Team,
  Golfer,
  Tournament,
  TourCard,
  Member,
  LeaderboardVariant,
} from "../types";

interface PGCLeaderboardProps {
  teams: Team[];
  golfers: Golfer[];
  tournament: Tournament;
  tourCard?: TourCard | null;
  member?: Member | null;
  activeTour: string;
  variant: LeaderboardVariant;
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
    const sortedTeams = sortTeams(teams ?? []);

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
      {filteredTeams.map((team) => (
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
      ))}
    </>
  );
};
