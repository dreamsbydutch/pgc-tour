import LeaderboardHeader from "@/src/app/tournament/_components/LeaderboardHeader";
import { Suspense } from "react";
import ToursToggle from "@/src/app/tournament/_components/ToursToggle";
import { LeaderboardHeaderSkeleton } from "../_components/skeletons/LeaderboardHeaderSkeleton";
import { LeaderboardListSkeleton } from "../_components/skeletons/LeaderboardListSkeleton";
import { LeaderboardListing } from "../_components/LeaderboardListing";

export default async function Page({
  params,
  searchParams,
}: {
  params: { tournamentId: string };
  searchParams?: Record<string, string | undefined>;
}) {
  return (
    <div className="flex w-full flex-col">
      <Suspense fallback={<LeaderboardHeaderSkeleton />}>
        <LeaderboardHeader focusTourneyId={params.tournamentId} />
      </Suspense>
      <Suspense fallback={<LeaderboardListSkeleton />}>
        {/* <ToursToggle {...{ searchParams }}> */}
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
        {/* </ToursToggle> */}
      </Suspense>
    </div>
  );
}
