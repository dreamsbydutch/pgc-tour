/**
 * PGCLeaderboard - Displays PGC teams leaderboard
 *
 * This component renders the leaderboard for PGC (Pro Golf Club) teams.
 * It filters teams based on the active tour and variant, then renders
 * each team using the LeaderboardListing component.
 *
 * @param teams - Array of teams with tour card information
 * @param golfers - Array of all golfers in the tournament
 * @param tournament - Tournament details
 * @param tourCard - Current user's tour card (for highlighting)
 * @param member - Member information (for friend highlighting)
 * @param activeTour - Currently selected tour ID
 * @param variant - Leaderboard type (regular or playoff)
 * @param isPreTournament - Whether tournament hasn't started yet
 */

import React from "react";
import { LeaderboardListing } from "./LeaderboardListing";
import { filterTeamsByTour } from "../utils";
import type {
  TeamWithTourCard,
  LeaderboardGolfer,
  LeaderboardTournament,
  LeaderboardTourCard,
  LeaderboardMember,
} from "../utils/types";

/**
 * Props for PGCLeaderboard component
 */
interface PGCLeaderboardProps {
  /** Teams to display in the leaderboard */
  teams: TeamWithTourCard[];
  /** All golfers in the tournament */
  golfers: LeaderboardGolfer[];
  /** Tournament information */
  tournament: LeaderboardTournament;
  /** Current user's tour card for highlighting */
  tourCard?: LeaderboardTourCard | null;
  /** Member data for friend highlighting */
  member?: LeaderboardMember | null;
  /** Currently active tour ID */
  activeTour: string;
  /** Leaderboard variant type */
  variant: "regular" | "playoff";
  /** Whether tournament hasn't started yet */
  isPreTournament?: boolean;
}

/**
 * PGC Leaderboard Component
 *
 * Renders a list of PGC teams filtered by the active tour and variant.
 * Each team is rendered using the LeaderboardListing component.
 */
export const PGCLeaderboard: React.FC<PGCLeaderboardProps> = ({
  teams,
  golfers,
  tournament,
  tourCard,
  member,
  activeTour,
  variant,
  isPreTournament = false,
}) => {
  // Filter and sort teams based on current tour and variant
  const filteredTeams = filterTeamsByTour(teams ?? [], activeTour, variant);

  return (
    <>
      {filteredTeams.map((team) => {
        // Skip teams without tour cards
        if (!team.tourCard) return null;

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
            isPreTournament={isPreTournament}
          />
        );
      })}
    </>
  );
};
