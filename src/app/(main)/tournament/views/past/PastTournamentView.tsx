"use client";

import type { Course, Tournament } from "@prisma/client";
import LeaderboardPage from "../shared/LeaderboardPage";

interface PastTournamentViewProps {
  tournament: Tournament & { course: Course | null };
  inputTour: string;
}

export default function PastTournamentView({
  tournament,
  inputTour,
}: PastTournamentViewProps) {
  return (
    <>
      {/* Optionally add a small header here indicating this is a past tournament */}
      <div className="my-0.5">
        <span className="text-2xs text-slate-500">Final Results</span>
      </div>

      {/* The actual leaderboard */}
      <LeaderboardPage tournament={tournament} inputTour={inputTour} />
    </>
  );
}
