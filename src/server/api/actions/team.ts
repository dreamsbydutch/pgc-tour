"use server";

import { api } from "@/src/trpc/server";

export async function teamCreateOnFormSubmit({
  value,
  tournamentId,
  tourCardId,
}: {
  value: {
    groups: { golfers: number[] }[];
  };
  tournamentId: string;
  tourCardId: string;
}) {
  await api.team.create({
    golferIds: value.groups.flatMap((group) => group.golfers),
    tourCardId: tourCardId,
    tournamentId: tournamentId,
  });
}
