"use server";

import { api } from "@/src/trpc/server";
import TournamentCountdown from "../../_components/TournamentCountdown";
import LoadingSpinner from "@/src/app/_components/LoadingSpinner";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import CreateTeamForm from "./CreateTeamForm";

export default async function CreateTeamPage({
  params,
}: {
  params: { tournamentId: string };
}) {
  const tourCard = await api.tourCard.getOwnBySeason({});
  const tournament = await api.tournament.getById({
    tournamentId: params.tournamentId,
  });
  const current = await api.tournament.getCurrent();

  if (!tournament) return <LoadingSpinner />;
  return (
    <>
      <TournamentCountdown tourney={tournament} key={tournament?.id} />

      <div className="flex flex-col items-center font-varela">
        <Link
          className="mb-8 flex w-fit flex-row items-center justify-center self-start rounded-md border border-gray-400 px-2 py-0.5"
          href={`/tournament/${tournament.id}`}
        >
          <ArrowLeftIcon size={15} /> Back To Tournament
        </Link>

        <div className="mt-6 flex flex-row items-center text-sm text-gray-500">
          {`Pick your team for the ${tournament.name}`}
        </div>
        {!tourCard ? (
          <div>You need a Tour Card to pick a team.</div>
        ) : current ? (
          <div>The tournament has begun.</div>
        ) : (
          <CreateTeamForm {...{ tournament, tourCard }} />
        )}
      </div>
    </>
  );
}
