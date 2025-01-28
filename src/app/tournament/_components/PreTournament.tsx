"use client";

import TournamentCountdown from "./TournamentCountdown";
import type { TournamentData } from "@/src/types/prisma_include";
import { cn, formatMoney } from "@/src/lib/utils";
import { Button } from "../../_components/ui/button";
import { useRouter } from "next/navigation";
import { api } from "@/src/trpc/react";
import type { Member, TourCard } from "@prisma/client";

export default function PreTournamentPage({
  tournament,
  member,
  tourCard,
}: {
  tournament: TournamentData;
  member: Member;
  tourCard: TourCard;
}) {
  return (
    <div>
      <TournamentCountdown tourney={tournament} key={tournament.id} />
      <TeamPickForm {...{ member, tourCard, tournament }} />
    </div>
  );
}

function TeamPickForm({
  member,
  tourCard,
  tournament,
}: {
  member: Member;
  tourCard: TourCard;
  tournament: TournamentData;
}) {
  const router = useRouter();
  const existingTeam = api.team.getByUserTournament.useQuery({
    tourCardId: tourCard?.id ?? "",
    tournamentId: tournament.id,
  }).data;
  const golfers = api.golfer.getByTournament.useQuery({
    tournamentId: tournament.id,
  }).data;

  if (!golfers || golfers?.length === 0) return <></>;

  const teamGolfers = golfers
    .filter((obj) => existingTeam?.golferIds.includes(obj.apiId))
    .sort(
      (a, b) => (a.worldRank && b.worldRank && a.worldRank - b.worldRank) ?? 0,
    )
    .sort((a, b) => (a.group && b.group && a.group - b.group) ?? 0);
  return (
    <div className="mx-auto mb-4 w-fit max-w-4xl rounded-lg border border-slate-400 bg-slate-100 px-6 py-2 text-center shadow-xl">
      <div className="text-2xl font-bold">{member?.fullname}</div>
      <div className="text-xl font-bold">{`${tourCard?.position} - ${tourCard?.points} pts${tourCard?.earnings ? " - " + formatMoney(tourCard?.earnings ?? 0) : ""}`}</div>
      {teamGolfers.map((golfer, i) => {
        return (
          <div
            key={golfer?.id}
            className={cn(
              "py-0.5 text-lg",
              i % 2 !== 0 && i < 9 && "border-b border-slate-500",
              i === 0 && "mt-2",
            )}
          >
            {`#${golfer?.worldRank} ${golfer?.playerName} (${golfer?.rating})`}
          </div>
        );
      })}
      <Button
        key={existingTeam?.id}
        onClick={() => router.push(`/tournament/${tournament.id}/create-team`)}
        variant={"action"}
        className="mb-4 mt-8 text-xl"
        size="lg"
      >
        {existingTeam ? "Change Your Team" : "Create Your Team"}
      </Button>
    </div>
  );
}
