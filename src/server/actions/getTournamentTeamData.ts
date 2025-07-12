import { api } from "@pgc-trpcServer";

export async function getTournamentTeamData({
  tournamentId,
  tourCardId,
}: {
  tournamentId: string;
  tourCardId: string;
}) {
  const team = await api.team.getByUserTournament({ tourCardId, tournamentId });
  if (!team) {
    return null;
  }

  const golfers = await api.golfer.getByTournament({ tournamentId });
  return {
    ...team,
    golfers: golfers.filter((g) => team.golferIds.includes(g.apiId)),
  };
}
