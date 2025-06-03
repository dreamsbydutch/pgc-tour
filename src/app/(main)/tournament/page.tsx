"use client";

import { useMainStore } from "@/src/lib/store/store";
import { useSearchParams } from "next/navigation";
import {
  LeaderboardHeaderSkeleton,
  TournamentCountdownSkeleton,
  LeaderboardHeader,
} from "./components";
import {
  PreTournamentPage,
  TeamPickFormSkeleton,
  ActiveTournamentView,
  PastTournamentView,
  HistoricalTournamentView,
} from "./views";
import { Suspense } from "react";

// Force dynamic rendering to prevent static generation issues
export const dynamic = "force-dynamic";

// Component that uses useSearchParams - needs to be wrapped in Suspense
function TournamentPageContent() {
  const searchParams = useSearchParams();

  const currentTournament = useMainStore((state) => state.currentTournament);
  const nextTournament = useMainStore((state) => state.nextTournament);
  const pastTournaments = useMainStore((state) => state.pastTournaments);
  const seasonTournaments = useMainStore((state) => state.seasonTournaments);

  const tournamentIdParam = searchParams.get("id");

  // Determine which tournament to show
  const getDisplayTournament = () => {
    // If there's an ID in search params, try to find that tournament
    if (tournamentIdParam) {
      return seasonTournaments?.find((t) => t.id === tournamentIdParam) ?? null;
    }

    // No ID provided - determine best tournament to show
    if (currentTournament) {
      return currentTournament;
    } else if (nextTournament) {
      return nextTournament;
    } else if ((pastTournaments ?? []).length > 0) {
      // Get most recent past tournament
      const mostRecentPastTournament = pastTournaments?.sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      )[0];
      return mostRecentPastTournament ?? null;
    } else if ((seasonTournaments?.length ?? 0) > 0) {
      return seasonTournaments?.[0] ?? null;
    }

    return null;
  };

  const focusTourney = getDisplayTournament();

  if (!focusTourney && tournamentIdParam) {
    return <HistoricalTournamentView tournamentId={tournamentIdParam} />;
  }

  // While loading tournament data, show loading view
  if (!focusTourney) {
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

      {isActive && (
        // Active tournament with polling and live updates
        <ActiveTournamentView
          tournament={focusTourney}
          inputTour={searchParams.get("tour") ?? ""}
        />
      )}

      {isPast && (
        // Past tournament with static data display
        <PastTournamentView
          tournament={focusTourney}
          inputTour={searchParams.get("tour") ?? ""}
        />
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

/**
 * Unified tournament page that handles displaying any tournament
 * Uses query parameter ?id=tournamentId instead of path parameter
 */
export default function TournamentPage() {
  return (
    <Suspense fallback={<TournamentPageLoadingView />}>
      <TournamentPageContent />
    </Suspense>
  );
}
