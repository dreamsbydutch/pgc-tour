import LeaderboardHeader from "@/src/app/tournament/_components/LeaderboardHeader";
import { Suspense } from "react";
import ToursToggle from "@/src/app/tournament/_components/ToursToggle";
import { LeaderboardHeaderSkeleton } from "../_components/skeletons/LeaderboardHeaderSkeleton";
import { LeaderboardListSkeleton } from "../_components/skeletons/LeaderboardListSkeleton";
import { LeaderboardListing } from "../_components/LeaderboardListing";
import PreTournamentPage from "../_components/PreTournament";
import LoadingSpinner from "../../_components/LoadingSpinner";
import { api } from "@/src/trpc/server";

export default async function Page({
  params,
  searchParams,
}: {
  params: { tournamentId: string };
  searchParams?: Record<string, string | undefined>;
}) {
  const tournament = await api.tournament.getById({
    tournamentId: params.tournamentId,
  });
  if (!tournament) return <LoadingSpinner />;
  return (
    <div className="flex w-full flex-col">
      <Suspense fallback={<LeaderboardHeaderSkeleton />}>
        <LeaderboardHeader focusTourney={tournament} />
      </Suspense>
      {tournament.startDate > new Date() ? (
        <PreTournamentPage {...{ tournament }} />
      ) : (
        <Suspense fallback={<LeaderboardListSkeleton />}>
          <ToursToggle {...{ searchParams, tournamentId: params.tournamentId }}>
            <div className="mx-auto grid max-w-xl grid-flow-row grid-cols-10 text-center">
              <div className="col-span-2 place-self-center font-varela text-sm font-bold">
                Rank
              </div>
              <div className="col-span-4 place-self-center font-varela text-base font-bold">
                Name
              </div>
              <div className="col-span-2 place-self-center font-varela text-sm font-bold">
                Score
              </div>
              <div className="col-span-1 place-self-center font-varela text-2xs">
                Today
              </div>
              <div className="col-span-1 place-self-center font-varela text-2xs">
                Thru
              </div>
            </div>
            <LeaderboardListing
              {...{ searchParams, tournamentId: params.tournamentId }}
            />
          </ToursToggle>
        </Suspense>
      )}
    </div>
  );
}
