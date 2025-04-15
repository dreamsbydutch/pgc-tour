"use client";

import { api } from "@/src/trpc/react";
import type { TourCard } from "@prisma/client";
import Image from "next/image";

export default function LittleFucker({ tourCard }: { tourCard: TourCard }) {
  const majors = api.tournament.getBySeason
    .useQuery({
      seasonId: tourCard.seasonId,
    })
    .data?.filter(
      (t) => t.tier.name === "Major" && new Date(t.endDate) < new Date(),
    );
  const teams = api.team.getByTourCard
    .useQuery({
      tourCardId: tourCard.id,
    })
    .data?.filter(
      (a) =>
        a.position === "1" && majors?.map((a) => a.id).includes(a.tournamentId),
    );
  return (
    (teams ?? []).length > 0 &&
    teams?.map((team) => (
      <Image
        key={team.id}
        src={majors?.find((a) => a.id === team.tournamentId)?.logoUrl ?? ""}
        alt="Major Champ Logo"
        width={512}
        height={512}
        className="mx-0.5 inline-block h-6 w-6"
      />
    ))
  );
}
