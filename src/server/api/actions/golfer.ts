"use server";

import { api } from "@/src/trpc/server";

export async function updateUsageForTournament({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const teams = await api.team.getByTournament({
    tournamentId,
  });
  const golfers = await api.golfer.getByTournament({
    tournamentId,
  });
  const unusedGolfers = golfers.filter((a) => a.usage === 0);
  for (const golfer of unusedGolfers) {
    const usageTeams = teams.filter((t) =>
      t.golferIds.includes(golfer.apiId),
    );
    if (usageTeams.length === 0) continue;
    await updateGolferUsage({
      golferId: golfer.id,
      usage: usageTeams.length / teams.length,
    });
  }
}

async function updateGolferUsage({
  golferId,
  usage,
}: {
  golferId: number;
  usage: number;
}) {
  return await api.golfer.update({
    id: golferId,
    usage,
  });
}
