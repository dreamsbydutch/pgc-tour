/**
 * PGCLeaderboard - Displays PGC teams leaderboard
 */

import React from "react";
import { LeaderboardListing } from "./LeaderboardListing";
import { sortTeams } from "../utils";
import { Golfer, Member, Team, TourCard, Tournament } from "@prisma/client";
import type {
  TeamWithTourCard,
  TournamentGolfer,
  LeaderboardTeam,
  LeaderboardTournament,
  LeaderboardTourCard,
  LeaderboardMember,
} from "../utils/types";

interface PGCLeaderboardProps {
  teams: TeamWithTourCard[];
  golfers: Golfer[];
  tournament: Tournament;
  tourCard?: TourCard | null;
  member?: Member | null;
  activeTour: string;
  variant: "regular" | "playoff";
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

const mapToLeaderboardTeam = (team: TeamWithTourCard): LeaderboardTeam => ({
  pastPosition: team.pastPosition ?? "T1",
  position: team.position ?? "CUT",
  golferIds: team.golferIds,
  today: team.today ?? 0,
  thru: team.thru ?? 0,
  score: team.score ?? 0,
  round: team.round ?? 1,
  points: team.points ?? 0,
  earnings: team.earnings ?? 0,
  id: team.id,
});

const mapToLeaderboardTournament = (
  tournament: Tournament,
): LeaderboardTournament => ({
  currentRound: tournament.currentRound ?? 1,
});

const mapToLeaderboardTourCard = (tourCard: TourCard): LeaderboardTourCard => ({
  id: tourCard.id,
  memberId: tourCard.memberId,
  displayName: tourCard.displayName,
});

const mapToLeaderboardMember = (member: Member): LeaderboardMember => ({
  friends: member.friends,
});

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
  const mappedTournamentGolfers = mapToTournamentGolfers(golfers);
  const mappedTournament = mapToLeaderboardTournament(tournament);

  return (
    <>
      {filteredTeams.map((team) => {
        if (!team.tourCard || !tourCard || !member) return null;

        return (
          <LeaderboardListing
            key={team.id}
            type="PGC"
            tournament={mappedTournament}
            tournamentGolfers={mappedTournamentGolfers}
            tourCard={mapToLeaderboardTourCard(team.tourCard)}
            userTourCard={{ id: tourCard.id }}
            team={mapToLeaderboardTeam(team)}
            member={mapToLeaderboardMember(member)}
          />
        );
      })}
    </>
  );
};
