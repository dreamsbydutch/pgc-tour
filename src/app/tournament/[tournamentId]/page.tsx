import LeaderboardHeader from "@/src/app/tournament/_components/LeaderboardHeader";
import { Suspense } from "react";
import { LeaderboardHeaderSkeleton } from "../_components/skeletons/LeaderboardHeaderSkeleton";
import { LeaderboardListSkeleton } from "../_components/skeletons/LeaderboardListSkeleton";
import PreTournamentPage from "../_components/PreTournament";
import LoadingSpinner from "../../_components/LoadingSpinner";
import { api } from "@/src/trpc/server";
import LeaderboardPage from "../_components/LeaderboardPage";
import TournamentCountdown from "../_components/TournamentCountdown";

export default async function Page({
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
  const golfers = await api.golfer.getByTournament({
    tournamentId: tournament?.id ?? "",
  });
  const teams = await api.team.getByTournament({
    tournamentId: tournament?.id ?? "",
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
      {!member || !tourCard ? (
        <div>Not a member</div>
      ) : tournament.startDate > new Date() ? (
        // <PreTournamentPage {...{ tournament, member, tourCard }} />
        <TournamentCountdown tourney={tournament} key={tournament.id} />
      ) : (
        <Suspense fallback={<LeaderboardListSkeleton />}>
          <LeaderboardPage
            {...{
              tournament,
              tours: [...tours, pgaTour],
              member,
              tourCard,
              golfers,
              teams,
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
