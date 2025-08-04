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
 */
function isPlayoffTournament(tournament: { tier?: { name: string } }): boolean {
  return tournament.tier?.name.toLowerCase().includes("playoff") ?? false;
}

/**
 * Helper function to determine if a user is eligible for playoff tournaments
 */
function isPlayoffEligible(
  tourCard: { playoff: number } | null | undefined,
): boolean {
  return (tourCard?.playoff ?? 0) >= 1;
}

export interface PreTournamentContentProps {
  tournament: Pick<Tournament, "id" | "name" | "logoUrl" | "startDate"> & {
    tier?: { name: string };
  };
  member?: Pick<Member, "firstname" | "lastname" | "account"> | null;
  tourCard?: Pick<
    TourCard,
    "points" | "earnings" | "position" | "playoff"
  > | null;
  existingTeam?: Pick<Team, "id"> | null;
  teamGolfers?: Pick<
    Golfer,
    "id" | "playerName" | "worldRank" | "rating" | "group"
  >[];
}

export function PreTournamentContent({
  tournament,
  member,
  tourCard,
  existingTeam,
  teamGolfers,
}: PreTournamentContentProps) {
  // Memoize the time calculation to prevent constant re-calculations
  const canPickTeam = useMemo(() => {
    const msUntilStart = new Date(tournament.startDate).getTime() - Date.now();
    return msUntilStart <= 4 * 24 * 60 * 60 * 1000;
  }, [tournament.startDate]);

  // Check if this is a playoff tournament and if user is eligible
  const isPlayoff = isPlayoffTournament(tournament);
  const isEligibleForPlayoffs = isPlayoffEligible(tourCard);

  // Determine if user can make picks
  const canMakePicks = useMemo(() => {
    if (!canPickTeam || !tourCard || !member) return false;

    // For playoff tournaments, check playoff eligibility
    if (isPlayoff && !isEligibleForPlayoffs) return false;

    return true;
  }, [canPickTeam, tourCard, member, isPlayoff, isEligibleForPlayoffs]);

  return (
    <div>
      {/* Show ineligibility message for playoff tournaments */}
      {canPickTeam &&
        tourCard &&
        member &&
        isPlayoff &&
        !isEligibleForPlayoffs && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <p className="font-medium text-red-800">
              You did not qualify for the 2025 PGC Playoffs
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
    </div>
  );
}
