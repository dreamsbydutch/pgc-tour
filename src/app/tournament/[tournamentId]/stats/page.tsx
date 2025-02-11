import LoadingSpinner from "@/src/app/_components/LoadingSpinner";
import { api } from "@/src/trpc/server";
import LeaderboardHeader from "../../_components/LeaderboardHeader";
import { LeaderboardHeaderSkeleton } from "../../_components/skeletons/LeaderboardHeaderSkeleton";
import { Suspense } from "react";
import StatsPage from "../../_components/StatsPage";

export default async function page({
  params,
}: {
  params: { tournamentId: string };
}) {
  const member = await api.member.getSelf();
  const tournament = await api.tournament.getById({
    tournamentId: params.tournamentId,
  });
  const tours = await api.tour.getBySeason({
    seasonID: tournament?.seasonId,
  });
  const tourCard = await api.tourCard.getByUserSeason({
    seasonId: tournament?.seasonId,
    userId: member?.id,
  });
  if (!tournament || !tours) return <LoadingSpinner />;

  return (
    <div className="flex w-full flex-col">
      <Suspense fallback={<LeaderboardHeaderSkeleton />}>
        <LeaderboardHeader focusTourney={tournament} />
      </Suspense>
      <Suspense fallback={<LoadingSpinner />}>
        <StatsPage
          {...{
            tournament,
            tours,
            tourCard: tourCard ?? undefined,
          }}
        />
      </Suspense>
    </div>
  );
}
