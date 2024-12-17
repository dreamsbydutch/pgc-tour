import LeaderboardHeader from "@/src/app/tournament/_components/LeaderboardHeader";
import { Suspense } from "react";
import ToursToggle from "@/src/app/tournament/_components/ToursToggle";
import { LeaderboardListing } from "../page";
import { LeaderboardHeaderSkeleton } from "../_components/skeletons/LeaderboardHeaderSkeleton";
import { LeaderboardListSkeleton } from "../_components/skeletons/LeaderboardListSkeleton";

export default async function Page({
  children,
  params,
  searchParams,
}: {
  children: React.ReactNode;
  params: { tournamentId: string };
  searchParams?: { [key: string]: string | undefined };
}) {
  return (
    <div className="flex w-full flex-col">
      <Suspense fallback={<LeaderboardHeaderSkeleton />}>
        <LeaderboardHeader focusTourneyId={params.tournamentId} />
      </Suspense>
      <ToursToggle {...{ searchParams }}>
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
        <Suspense fallback={<LeaderboardListSkeleton />}>
          <LeaderboardListing {...{ searchParams }} />
        </Suspense>
      </ToursToggle>
    </div>
  );
}
