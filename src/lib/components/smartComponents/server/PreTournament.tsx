import type { Tournament } from "@prisma/client";
import PreTournamentPageRender from "../../functionalComponents/client/PreTournamentPageRender";
import { getMemberFromHeaders } from "@/lib/supabase/auth-helpers";
import { getTournamentTeamData } from "@/server/actions/getTournamentTeamData";
import TournamentCountdownContainer from "./TournamentCountdownContainer";

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
  const { tourCard, existingTeam, teamGolfers } = await getTournamentTeamData({
    tournamentId: tournament.id,
    memberId: member?.id ?? null,
    seasonId: tournament.seasonId,
  });

  // No need for pickingTeam/setPickingTeam in server component; pass as false and a no-op
  return (
    <>
      <TournamentCountdownContainer inputTourney={tournament} />
      <PreTournamentPageRender
        tournament={tournament}
        member={member}
        tourCard={tourCard}
        existingTeam={existingTeam}
        teamGolfers={teamGolfers}
      />
    </>
  );
}
