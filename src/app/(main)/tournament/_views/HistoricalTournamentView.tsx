"use client";

<<<<<<< Updated upstream:src/app/(main)/tournament/_views/HistoricalTournamentView.tsx
import LeaderboardHeader from "../_components/header/LeaderboardHeader";
import { HistoricalLeaderboardPage, PlayoffLeaderboardPage } from "./LeaderboardPage";
import { api } from "@/src/trpc/react";
=======
import LeaderboardHeader from "../../components/header/LeaderboardHeader";
import {
  HistoricalLeaderboardPage,
  PlayoffLeaderboardPage,
} from "../shared/LeaderboardPage";
import { useTournamentById, useCourses, useTiers } from "@/src/lib/store";
import type {  Course, Tier } from "@/src/lib/store/types";
>>>>>>> Stashed changes:src/app/(main)/tournament/views/past/HistoricalTournamentView.tsx

interface PastTournamentViewProps {
  tournamentId: string;
}

export default function HistoricalTournamentView({
  tournamentId,
}: PastTournamentViewProps) {
  // Use store hooks instead of direct tRPC calls
  const {
    tournament,
    loading: tournamentLoading,
    error: tournamentError,
  } = useTournamentById(tournamentId);
  const { courses, loading: coursesLoading } = useCourses();
  const { tiers, loading: tiersLoading } = useTiers();

  // Get course and tier from cached data
  const course =
    courses?.find((c: Course) => c.id === tournament?.courseId) ?? null;
  const tier = tiers?.find((t: Tier) => t.id === tournament?.tierId);

  // Loading state
  if (tournamentLoading || coursesLoading || tiersLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        Loading...
      </div>
    );
  }

  // Error state
  if (tournamentError || !tournament) {
    return (
      <div className="flex h-full w-full items-center justify-center text-red-500">
        {tournamentError ?? "Tournament not found"}
      </div>
    );
  }

  // Data validation
  if (!course || !tier) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        Loading tournament details...
      </div>
    );
  }

  return (
    <div className="mx-4 flex flex-col">
      <LeaderboardHeader {...{ focusTourney: tournament }} />
      {/* Optionally add a small header here indicating this is a past tournament */}
      <div className="my-0.5">
        <span className="text-2xs text-slate-500">Final Results</span>
      </div>

      {/* The actual leaderboard */}
      {tier.name === "Playoff" ? (
        <PlayoffLeaderboardPage
          tournament={{
            ...tournament,
            course: course ?? null,
          }}
        />
      ) : (
        <HistoricalLeaderboardPage
          tournament={{
            ...tournament,
            course: course ?? null,
          }}
        />
      )}
    </div>
  );
}
