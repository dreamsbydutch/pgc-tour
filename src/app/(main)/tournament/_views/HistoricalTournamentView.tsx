"use client";

import LeaderboardHeader from "../_components/header/LeaderboardHeader";
import {
  HistoricalLeaderboardPage,
  PlayoffLeaderboardPage,
} from "./LeaderboardPage";
import { api } from "@/trpc/react";

interface PastTournamentViewProps {
  tournamentId: string;
}

export default function HistoricalTournamentView({
  tournamentId,
}: PastTournamentViewProps) {
  // Use direct API calls for historical tournament data
  const {
    data: tournament,
    isLoading: tournamentLoading,
    error: tournamentError,
  } = api.tournament.getById.useQuery({ tournamentId });

  const { data: course, isLoading: courseLoading } =
    api.course.getById.useQuery(
      { courseID: tournament?.courseId! },
      { enabled: !!tournament?.courseId },
    );

  const { data: tier, isLoading: tierLoading } = api.tier.getById.useQuery(
    { id: tournament?.tierId! },
    { enabled: !!tournament?.tierId },
  );

  // Loading state
  if (tournamentLoading || courseLoading || tierLoading) {
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
        {tournamentError?.message ?? "Tournament not found"}
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
