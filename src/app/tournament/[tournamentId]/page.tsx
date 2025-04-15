import LeaderboardHeader from "@/src/app/tournament/_components/header/LeaderboardHeader";
import { Suspense } from "react";
import { LeaderboardHeaderSkeleton } from "../_components/skeletons/LeaderboardHeaderSkeleton";
import { LeaderboardListSkeleton } from "../_components/skeletons/LeaderboardListSkeleton";
import LoadingSpinner from "../../_components/LoadingSpinner";
import { api } from "@/src/trpc/server";
import LeaderboardPage from "../_views/LeaderboardPage";
import PreTournamentPage from "../_components/PreTournament";
import type { Member } from "@prisma/client";

export default async function Page({
  params,
  searchParams,
}: {
  params: { tournamentId: string };
  searchParams: Record<string, string>;
}) {
  const member = (await api.member.getSelf()) as Member | undefined;
  const tournament = await api.tournament.getById({
    tournamentId: params.tournamentId,
  });
  const tourCard = await api.tourCard.getByUserSeason({
    userId: member?.id,
    seasonId: tournament?.seasonId,
  });
  const tours = await api.tour.getBySeason({
    seasonID: tournament?.seasonId,
  });
  const teams = await api.team.getByTournament({
    tournamentId: tournament?.id ?? "",
  });
  if (!tournament || !tourCard || !member) return <LoadingSpinner />;

  return (
    <div className="flex w-full flex-col">
      <Suspense fallback={<LeaderboardHeaderSkeleton />}>
        <LeaderboardHeader focusTourney={tournament} />
      </Suspense>
      {tournament.startDate > new Date() ? (
        <PreTournamentPage {...{ tournament, tourCard, teams }} />
      ) : (
        <Suspense fallback={<LeaderboardListSkeleton />}>
          <LeaderboardPage
            {...{
              tournament,
              tourCard,
              inputTour: searchParams.tour ?? "",
              tours,
              teams,
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
