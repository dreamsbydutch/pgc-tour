import { Suspense } from "react";
import {
  LeaderboardHeaderSkeleton,
  TournamentCountdownSkeleton,
} from "./components";
import { TeamPickFormSkeleton } from "./views";

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
