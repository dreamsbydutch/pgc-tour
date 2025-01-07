"use server";

import { api } from "@/src/trpc/server";
import TournamentCountdown from "../../_components/TournamentCountdown";
import CreateTeamForm from "./CreateTeamForm";
import LoadingSpinner from "@/src/app/_components/LoadingSpinner";

export default async function CreateTeamPage({
  params,
}: {
  params: { tournamentId: string };
}) {
  const member = await api.member.getSelf();
  const tourCard = await api.tourCard.getOwnBySeason({});
  const tournament = await api.tournament.getById({
    tournamentId: params.tournamentId,
  });

  if (!tournament) return <LoadingSpinner />;
  return (
    <>
      <TournamentCountdown tourney={tournament} key={tournament?.id} />
      <div>
        {member?.fullname}
        {!tourCard ? (
          <div>You need a Tour Card to pick a team.</div>
        ) : (
          <CreateTeamForm {...{ tournament }} />
        )}
      </div>
    </>
  );
}
