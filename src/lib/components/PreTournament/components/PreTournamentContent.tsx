"use client";

import { useMemo, useEffect, useState } from "react";
import type {
  Golfer,
  Member,
  Team,
  TourCard,
  Tournament,
} from "@prisma/client";
import { TeamPickForm } from "./TeamPickForm";
import { SignInButton } from "../../Navigation";

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
  // Avoid hydration mismatch: initialize as false on server and compute after mount
  const [isPreTournament, setIsPreTournament] = useState(false);
  useEffect(() => {
    try {
      const msUntilStart =
        new Date(tournament.startDate).getTime() - Date.now();
      setIsPreTournament(msUntilStart <= 4 * 24 * 60 * 60 * 1000);
    } catch (error) {
      console.warn("Error calculating team pick availability:", error);
      setIsPreTournament(false);
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

  // Simplified guards via clear boolean helpers
  const hasEssentials = isPreTournament && !!tourCard && !!member;
  const hasPlayoffData = typeof tourCard?.playoff === "number";
  const isLaterPlayoff = isPlayoff && playoffEventIndex > 1;
  const hasEmptyTeam = existingTeam?.golferIds?.length === 0;

  // Early return for basic cases to prevent hydration issues
  if (!tournament || !tournament.startDate) {
    return <div>Loading tournament information...</div>;
  }

  if (!isPreTournament) {
    return (
      <div className="text-center">
        Picks are closed for this tournament. Please check back later.
      </div>
    );
  }
  if (!hasEssentials) {
    return (
      <div className="text-center">
        <p className="font-medium text-red-800">
          Please sign in to pick a team.
        </p>
        <SignInButton />
      </div>
    );
  }
  if (!isPlayoff) {
    return (
      <div>
        <TeamPickForm
          tournament={tournament}
          tourCard={tourCard}
          member={member}
          existingTeam={existingTeam}
          teamGolfers={teamGolfers}
        />
      </div>
    );
  }
  if (hasPlayoffData && !isEligibleForPlayoffs) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
        <p className="font-medium text-red-800">
          You did not qualify for the {tournament.tier?.name ?? "Playoffs"}.
        </p>
      </div>
    );
  }
  if (!isLaterPlayoff) {
    return (
      <div>
        <TeamPickForm
          tournament={tournament}
          tourCard={tourCard}
          member={member}
          existingTeam={existingTeam}
          teamGolfers={teamGolfers}
        />
      </div>
    );
  }
  if (hasEmptyTeam) {
    return (
      <div>
        <TeamPickForm
          tournament={tournament}
          tourCard={tourCard}
          member={member}
          existingTeam={existingTeam}
          teamGolfers={teamGolfers}
        />
      </div>
    );
  }
  if (!hasEmptyTeam) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center">
        <p className="font-medium text-yellow-800">
          Picks are closed for this playoff event. Your team carried over from
          the first playoff.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-amber-200 bg-yellow-50 p-4 text-center">
      <p className="font-medium text-yellow-800">
        How did you even get here? This should never be displayed.
      </p>
    </div>
  );
}
