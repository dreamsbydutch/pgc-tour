"use client";

import { useMainStore } from "@/src/lib/store/store";
import { useSearchParams } from "next/navigation";
import { LeaderboardHeaderSkeleton } from "@/src/app/(main)/tournament/_components/skeletons/LeaderboardHeaderSkeleton";
import PreTournamentPage, {
  TeamPickFormSkeleton,
} from "@/src/app/(main)/tournament/_views/PreTournament";
import LeaderboardHeader from "@/src/app/(main)/tournament/_components/header/LeaderboardHeader";
import { TournamentCountdownSkeleton } from "@/src/lib/components/smartComponents/TournamentCountdown";
import ActiveTournamentView from "./_views/ActiveTournamentView";
import PastTournamentView from "./_views/PastTournamentView";
import HistoricalTournamentView from "./_views/HistoricalTournamentView";

/**
 * Unified tournament page that handles displaying any tournament
 * Uses query parameter ?id=tournamentId instead of path parameter
 */
export default function TournamentPage() {
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
    return <HistoricalTournamentView tournamentId={tournamentIdParam} />
  }

  // While loading tournament data, show loading view
  if (!focusTourney) {
    return <TournamentPageLoadingView />;
  }

  // Determine tournament state
  const now = new Date();
  const tournamentStartDate = new Date(tournament.startDate);
  const tournamentEndDate = new Date(tournament.endDate);

  return {
    isUpcoming: tournamentStartDate > now,
    isActive: tournamentStartDate <= now && tournamentEndDate >= now,
    isPast: tournamentEndDate < now,
  };
}

/**
 * Organize tournaments into categories: current, next, and past
 */
function organizeTournaments(
  activeTournament: Tournament | null,
  tournaments: Tournament[],
) {
  const currentTournament = activeTournament;
  const pastTournaments =
    tournaments?.filter((t) => new Date(t.endDate) < new Date()) ?? [];
  const nextTournament =
    tournaments?.find(
      (t) =>
        new Date(t.startDate) > new Date() && t.id !== currentTournament?.id,
    ) ?? null;

  const seasonTournaments = [
    currentTournament,
    nextTournament,
    ...pastTournaments,
  ].filter(Boolean) as Tournament[];

  return {
    currentTournament,
    pastTournaments,
    nextTournament,
    seasonTournaments,
    isStoreLoaded: !!(
      currentTournament ??
      nextTournament ??
      pastTournaments.length
    ),
  };
}

/**
 * Find the tournament to display based on search params and tournament data
 */
function getDisplayTournament(
  tournamentIdParam: string | null,
  tournamentData: ReturnType<typeof organizeTournaments>,
) {
  const {
    currentTournament,
    nextTournament,
    pastTournaments,
    seasonTournaments,
  } = tournamentData;

  // If there's an ID in search params, try to find that tournament
  if (tournamentIdParam) {
    return seasonTournaments?.find((t) => t?.id === tournamentIdParam) ?? null;
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
        new Date(b?.startDate ?? "").getTime() -
        new Date(a?.startDate ?? "").getTime(),
    )?.[0];
    return mostRecentPastTournament ?? null;
  } else if ((seasonTournaments?.length ?? 0) > 0) {
    return seasonTournaments?.[0] ?? null;
  }

  return null;
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
