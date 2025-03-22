import LeaderboardHeader from "@/src/app/tournament/_components/header/LeaderboardHeader";
import { Suspense } from "react";
import { LeaderboardHeaderSkeleton } from "../_components/skeletons/LeaderboardHeaderSkeleton";
import { LeaderboardListSkeleton } from "../_components/skeletons/LeaderboardListSkeleton";
import LoadingSpinner from "../../_components/LoadingSpinner";
import { api } from "@/src/trpc/server";
import LeaderboardPage from "../_views/LeaderboardPage";
import PreTournamentPage from "../_components/PreTournament";
// import TournamentCountdown from "../_components/TournamentCountdown";

export default async function Page({
  params,
  searchParams,
}: {
  params: { tournamentId: string };
  searchParams: Record<string, string>;
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
  const pgaTour = {
    id: "1",
    shortForm: "PGA",
    name: "PGA Tour",
    logoUrl: "",
    seasonId: tournament?.seasonId ?? "",
    buyIn: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    tourCards: [],
  };
  if (!tournament || !tours) return <LoadingSpinner />;

  return (
    <div className="flex w-full flex-col">
      <Suspense fallback={<LeaderboardHeaderSkeleton />}>
        <LeaderboardHeader focusTourney={tournament} />
      </Suspense>
      {tournament.startDate > new Date() ? (
        <PreTournamentPage {...{ tournament, tourCard }} />
      ) : (
        <Suspense fallback={<LeaderboardListSkeleton />}>
          <LeaderboardPage
            {...{
              tournament,
              tours: [...tours, pgaTour],
              tourCard: tourCard ?? undefined,
              inputTour: searchParams.tour ?? "",
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
