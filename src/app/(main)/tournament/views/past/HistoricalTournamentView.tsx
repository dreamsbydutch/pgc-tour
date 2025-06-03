"use client";

import LeaderboardHeader from "../../components/header/LeaderboardHeader";
import {
  HistoricalLeaderboardPage,
  PlayoffLeaderboardPage,
} from "../shared/LeaderboardPage";
import { api } from "@/src/trpc/react";

interface PastTournamentViewProps {
  tournamentId: string;
}

export default function HistoricalTournamentView({
  tournamentId,
}: PastTournamentViewProps) {
  const tournament = api.tournament.getById.useQuery({
    tournamentId: tournamentId,
  }).data;
  const course = api.course.getById.useQuery({
    courseID: tournament?.courseId ?? "",
  }).data;
  const tier = api.tier.getBySeason
    .useQuery({ seasonId: tournament?.seasonId ?? "" })
    .data?.find((t) => t.id === tournament?.tierId);

  if (!tournament || !course || !tier) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        Loading...
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
