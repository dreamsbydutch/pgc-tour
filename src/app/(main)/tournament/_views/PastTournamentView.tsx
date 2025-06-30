"use client";

<<<<<<< Updated upstream:src/app/(main)/tournament/_views/PastTournamentView.tsx
import type { Course, Tournament } from "@prisma/client";
import LeaderboardPage from "./LeaderboardPage";
=======
import type { Tournament } from "@prisma/client";
import LeaderboardPage from "../shared/LeaderboardPage";
>>>>>>> Stashed changes:src/app/(main)/tournament/views/past/PastTournamentView.tsx

interface PastTournamentViewProps {
  tournament: Tournament;
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
