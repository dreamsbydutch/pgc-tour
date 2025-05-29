"use client";

import { useMainStore } from "@/src/lib/store/store";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { LeaderboardHeaderSkeleton } from "@/src/app/(main)/tournament/_components/skeletons/LeaderboardHeaderSkeleton";
import PreTournamentPage, {
  TeamPickFormSkeleton,
} from "@/src/app/(main)/tournament/_views/PreTournament";
import LeaderboardHeader from "@/src/app/(main)/tournament/_components/header/LeaderboardHeader";
import { TournamentCountdownSkeleton } from "@/src/app/(main)/tournament/_components/TournamentCountdown";
import ActiveTournamentView from "./_views/ActiveTournamentView";
import PastTournamentView from "./_views/PastTournamentView";
import HistoricalTournamentView from "./_views/HistoricalTournamentView";

/**
 * Unified tournament page that handles displaying any tournament
 * Uses query parameter ?id=tournamentId instead of path parameter
 */
export default function TournamentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  const currentTournament = useMainStore((state) => state.currentTournament);
  const nextTournament = useMainStore((state) => state.nextTournament);
  const pastTournaments = useMainStore((state) => state.pastTournaments);
  const seasonTournaments = useMainStore((state) => state.seasonTournaments);

  const tournamentIdParam = searchParams.get("id");

  // Get the tournament data based on the query parameter
  const focusTourney = tournamentIdParam
    ? (seasonTournaments?.find((t) => t.id === tournamentIdParam) ?? null)
    : null;

  useEffect(() => {
    if (!tournamentIdParam && !isLoading) {
      // Determine best tournament to show
      let bestTournamentId = null;

      if (currentTournament) {
        bestTournamentId = currentTournament.id;
      } else if (nextTournament) {
        bestTournamentId = nextTournament.id;
      } else if ((pastTournaments ?? []).length > 0) {
        // Get most recent past tournament
        const mostRecentPastTournament = pastTournaments?.sort(
          (a, b) =>
            new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        )[0];
        bestTournamentId = mostRecentPastTournament?.id;
      } else if ((seasonTournaments?.length ?? 0) > 0) {
        bestTournamentId = seasonTournaments?.[0]?.id;
      }

      // Update URL with query parameter instead of changing path
      if (bestTournamentId) {
        router.push(`/tournament?id=${bestTournamentId}`);
      }
    }
  }, [
    tournamentIdParam,
    isLoading,
    currentTournament,
    nextTournament,
    pastTournaments,
    seasonTournaments,
    router,
  ]);

  
  if (!focusTourney && tournamentIdParam) {
    return <HistoricalTournamentView tournamentId={tournamentIdParam} />
  }

  // While loading or redirecting, show loading view
  if (!tournamentIdParam || !focusTourney) {
    return <TournamentPageLoadingView />;
  }

  // Determine tournament state
  const now = new Date();
  const tournamentStartDate = new Date(focusTourney.startDate);
  const tournamentEndDate = new Date(focusTourney.endDate);
  const isUpcoming = tournamentStartDate > now;
  const isActive = tournamentStartDate <= now && tournamentEndDate >= now;
  const isPast = tournamentEndDate < now;

  return (
    <div className="mx-4 flex flex-col">
      <LeaderboardHeader {...{ focusTourney }} />

      {isUpcoming && (
        // Upcoming tournament view
        <PreTournamentPage tournament={focusTourney} />
      )}


    </div>
  );
}

// Simple loading view component
function TournamentPageLoadingView() {
  return (
    <>
      <LeaderboardHeaderSkeleton />
      <TournamentCountdownSkeleton />
      <TeamPickFormSkeleton />
    </>
  );
}
