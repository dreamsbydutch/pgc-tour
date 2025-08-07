/**
 * PlayoffLeaderboard - Displays playoff-specific leaderboard
 *
 * This component renders the leaderboard specifically for playoff tournaments.
 * It combines teams from all tours but filters by playoff level (Gold = 1, Silver = 2).
 * During playoffs, the traditional tour boundaries are broken down and replaced
 * with Gold and Silver divisions based on player qualification.
 *
 * @param teams - Array of teams with tour card information
 * @param golfers - Array of all golfers in the tournament
 * @param tournament - Tournament details
 * @param tourCard - Current user's tour card (for highlighting)
 * @param member - Member information (for friend highlighting)
 * @param activeTour - Currently selected tour ID (gold/silver)
 * @param isPreTournament - Whether tournament hasn't started yet
 */

"use client";

import React, { useMemo } from "react";
import { LeaderboardListing } from "./LeaderboardListing";
import { sortTeams } from "../utils";
import type {
  TeamWithTourCard,
  LeaderboardGolfer,
  LeaderboardTournament,
  LeaderboardTourCard,
  LeaderboardMember,
} from "../utils/types";

/**
 * Props for PlayoffLeaderboard component
 */
interface PlayoffLeaderboardProps {
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
  /** Currently active playoff division (gold/silver) */
  activeTour: string;
  /** Whether tournament hasn't started yet */
  isPreTournament?: boolean;
}

/**
 * Playoff Leaderboard Component
 *
 * Renders a list of teams filtered by playoff division (Gold or Silver).
 * During playoffs, teams from all regular tours are combined and divided
 * into Gold (playoff = 1) and Silver (playoff = 2) divisions.
 */
export const PlayoffLeaderboard: React.FC<PlayoffLeaderboardProps> = ({
  teams,
  golfers,
  tournament,
  tourCard,
  member,
  activeTour,
  isPreTournament = false,
}) => {
  // Filter and sort teams based on playoff division
  const filteredTeams = useMemo(() => {
    if (!Array.isArray(teams)) return [];

    try {
      // Sort all teams first
      const sortedTeams = sortTeams(teams) as TeamWithTourCard[];

      // Determine playoff level based on active tour
      let playoffLevel: number;
      switch (activeTour) {
        case "gold":
          playoffLevel = 1;
          break;
        case "silver":
          playoffLevel = 2;
          break;
        case "playoffs":
          // Single playoff level - include all playoff participants
          playoffLevel = 1;
          break;
        default:
          // For backwards compatibility or unknown values, default to Gold
          playoffLevel = 1;
          break;
      }

      // Filter teams by playoff level
      const filtered = sortedTeams.filter((team) => {
        // Defensive checks
        if (!team?.tourCard) return false;

        // For single playoffs, include all teams with any playoff level > 0
        if (activeTour === "playoffs") {
          return (team.tourCard.playoff ?? 0) > 0;
        }

        // For specific divisions, match exact playoff level
        return team.tourCard.playoff === playoffLevel;
      });

      return filtered;
    } catch (error) {
      console.error("Error filtering playoff teams:", error);
      return [];
    }
  }, [teams, activeTour]);

  // Render division info for debugging/clarity
  const divisionInfo = useMemo(() => {
    const totalTeams = filteredTeams.length;
    let divisionName: string;
    let level: number | string;

    switch (activeTour) {
      case "gold":
        divisionName = "Gold";
        level = 1;
        break;
      case "silver":
        divisionName = "Silver";
        level = 2;
        break;
      case "playoffs":
        divisionName = "Playoffs";
        level = "All";
        break;
      default:
        divisionName = "Unknown";
        level = "?";
        break;
    }

    return {
      name: divisionName,
      count: totalTeams,
      level,
    };
  }, [filteredTeams.length, activeTour]);

  // Show empty state if no teams match
  if (filteredTeams.length === 0) {
    const emptyStateMessage = (() => {
      switch (activeTour) {
        case "gold":
          return "Gold division includes top qualifying players (playoff level 1)";
        case "silver":
          return "Silver division includes qualifying players (playoff level 2)";
        case "playoffs":
          return "Playoff tournament includes all qualifying players";
        default:
          return "No teams found for this playoff division";
      }
    })();

    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="text-lg font-semibold text-gray-600">
          No teams in {divisionInfo.name} Division
        </div>
        <div className="mt-2 text-sm text-gray-500">{emptyStateMessage}</div>
      </div>
    );
  }

  return (
    <div className="playoff-leaderboard">

      {/* Render filtered teams */}
      {filteredTeams.map((team) => {
        // Additional defensive check
        if (!team?.tourCard) {
          console.warn(
            "Team without tour card found in playoff leaderboard:",
            team,
          );
          return null;
        }

        return (
          <LeaderboardListing
            key={`playoff-${team.id}`}
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
    </div>
  );
};
