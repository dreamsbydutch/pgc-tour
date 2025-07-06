import { Suspense } from "react";
import { LeaderboardHeaderSkeleton } from "../../../lib/components/functionalComponents/loading/LeaderboardHeaderSkeleton";
import { TournamentCountdownSkeleton } from "../../../lib/components/functionalComponents/TournamentCountdown";
import { TeamPickFormSkeleton } from "./_views/PreTournament";

export const metadata = {
  title: "Tournament",
  description: "Tournament overview and stats",
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<TournamentPageLoadingView />}>{children}</Suspense>
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
