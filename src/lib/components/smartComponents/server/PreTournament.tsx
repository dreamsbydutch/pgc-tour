import type { Tournament } from "@prisma/client";
import PreTournamentPageRender from "../../functionalComponents/client/PreTournamentPageRender";
import { getMemberFromHeaders } from "@/lib/supabase/auth-helpers";
import { getTournamentTeamData } from "@/server/api/getTournamentTeamData";

export default async function PreTournamentPage({
  tournament,
}: {
  tournament: Pick<
    Tournament,
    "id" | "name" | "logoUrl" | "startDate" | "seasonId"
  >;
}) {
  // Fetch member (user) from headers (server-side)
  const member = await getMemberFromHeaders();
  // Fetch all team/golfer/tourCard data for this tournament and member
  const { tourCard, existingTeam, teamGolfers, isTeamLoading, teamError } =
    await getTournamentTeamData({
      tournamentId: tournament.id,
      memberId: member?.id ?? null,
      seasonId: tournament.seasonId,
    });

  // No need for pickingTeam/setPickingTeam in server component; pass as false and a no-op
  return (
    <PreTournamentPageRender
      tournament={{
        id: tournament.id,
        name: tournament.name,
        logoUrl: tournament.logoUrl,
        startDate: tournament.startDate,
      }}
      member={
        member
          ? {
              firstname: member.firstname,
              lastname: member.lastname,
              account: member.account,
            }
          : null
      }
      tourCard={
        tourCard
          ? {
              points: tourCard.points,
              earnings: tourCard.earnings,
              position: tourCard.position,
            }
          : null
      }
      existingTeam={existingTeam ? { id: existingTeam.id } : null}
      teamGolfers={
        teamGolfers?.map((g) => ({
          id: g.id,
          playerName: g.playerName,
          worldRank: g.worldRank,
          rating: g.rating,
          group: g.group,
        })) ?? null
      }
      isTeamLoading={isTeamLoading}
      teamError={teamError as string | null}
      pickingTeam={false}
      setPickingTeam={() => {}}
    />
  );
}
