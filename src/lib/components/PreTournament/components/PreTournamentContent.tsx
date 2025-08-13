"use client";

import { useMemo } from "react";
import type {
  Golfer,
  Member,
  Team,
  TourCard,
  Tournament,
} from "@prisma/client";
import { TeamPickForm } from "./TeamPickForm";

/**
 * Helper function to determine if a tournament is a playoff tournament
 * Made more defensive to handle missing tier data
 * Falls back to tournament name if tier is not available
 */
function isPlayoffTournament(tournament: {
  tier?: { name?: string };
  name?: string;
}): boolean {
  try {
    // First try to check via tier name
    if (tournament.tier?.name) {
      return tournament.tier.name.toLowerCase().includes("playoff");
    }

    // Fallback to tournament name
    if (tournament.name) {
      return tournament.name.toLowerCase().includes("playoff");
    }

    return false;
  } catch (error) {
    console.warn("Error checking playoff tournament status:", error);
    return false;
  }
}

/**
 * Helper function to determine if a user is eligible for playoff tournaments
 * Made more defensive to handle missing data
 */
function isPlayoffEligible(
  tourCard: { playoff?: number } | null | undefined,
): boolean {
  try {
    return (tourCard?.playoff ?? 0) >= 1;
  } catch (error) {
    console.warn("Error checking playoff eligibility:", error);
    return false;
  }
}

export interface PreTournamentContentProps {
  tournament: Pick<Tournament, "id" | "name" | "logoUrl" | "startDate"> & {
    tier?: { name?: string };
  };
  member?: Pick<Member, "firstname" | "lastname" | "account"> | null;
  tourCard?:
    | (Pick<TourCard, "points" | "earnings" | "position"> & {
        playoff?: number;
      })
    | null;
  existingTeam?: Pick<Team, "id" | "golferIds"> | null;
  teamGolfers?: Pick<
    Golfer,
    "id" | "playerName" | "worldRank" | "rating" | "group"
  >[];
  // 0 for regular season or unknown, 1 for first playoff, 2/3 for later playoffs
  playoffEventIndex?: number;
}

export function PreTournamentContent({
  tournament,
  member,
  tourCard,
  existingTeam,
  teamGolfers,
  playoffEventIndex = 0,
}: PreTournamentContentProps) {
  // Memoize the time calculation to prevent constant re-calculations
  const canPickTeam = useMemo(() => {
    try {
      const msUntilStart =
        new Date(tournament.startDate).getTime() - Date.now();
      return msUntilStart <= 4 * 24 * 60 * 60 * 1000;
    } catch (error) {
      console.warn("Error calculating team pick availability:", error);
      return false;
    }
  }, [tournament.startDate]);

  // Check if this is a playoff tournament and if user is eligible
  const isPlayoff = useMemo(
    () => isPlayoffTournament(tournament),
    [tournament],
  );
  const isEligibleForPlayoffs = useMemo(
    () => isPlayoffEligible(tourCard),
    [tourCard],
  );

  // Determine if user can make picks
  const canMakePicks = useMemo(() => {
    try {
      if (!canPickTeam || !tourCard || !member) return false;

      // For playoff tournaments, check playoff eligibility
      // Only apply this restriction if we have playoff data available
      if (
        isPlayoff &&
        typeof tourCard.playoff === "number" &&
        !isEligibleForPlayoffs
      ) {
        return false;
      }

      // Additional rule: Only allow picks for the FIRST playoff event.
      // If this is the 2nd or later playoff event, disable new picks.
      if (
        isPlayoff &&
        playoffEventIndex >= 2 &&
        existingTeam?.golferIds.length === 0
      ) {
        return false;
      }

      return true;
    } catch (error) {
      console.warn("Error determining pick eligibility:", error);
      // Fallback to original behavior on error
      return canPickTeam && !!tourCard && !!member;
    }
  }, [
    canPickTeam,
    tourCard,
    member,
    isPlayoff,
    isEligibleForPlayoffs,
    playoffEventIndex,
    existingTeam?.golferIds.length,
  ]);

  // Early return for basic cases to prevent hydration issues
  if (!tournament || !tournament.startDate) {
    return <div>Loading tournament information...</div>;
  }

  return (
    <div>
      {/* Show ineligibility message for playoff tournaments */}
      {canPickTeam &&
        tourCard &&
        member &&
        isPlayoff &&
        typeof tourCard.playoff === "number" &&
        !isEligibleForPlayoffs && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <p className="font-medium text-red-800">
              You did not qualify for the 2025 PGC Playoffs
            </p>
          </div>
        )}

      {/* Show message when picks are closed for later playoff events */}
      {isPlayoff &&
        playoffEventIndex >= 2 &&
        existingTeam?.golferIds.length === 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
            <p className="font-medium text-yellow-800">
              Picks are closed for this playoff event. Teams carry over from the
              first playoff.
            </p>
          </div>
        )}

      {canMakePicks && tourCard && member && (
        <TeamPickForm
          tournament={tournament}
          tourCard={tourCard}
          member={member}
          existingTeam={existingTeam}
          teamGolfers={teamGolfers}
        />
      )}
      {!canMakePicks && !tourCard && member && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="font-medium text-red-800">
            Tour Card was not found for {member?.firstname ?? ""}{" "}
            {member?.lastname ?? ""}
          </p>
        </div>
      )}
    </div>
  );
}
