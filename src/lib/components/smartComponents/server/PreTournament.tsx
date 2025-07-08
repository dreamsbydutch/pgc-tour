import type { Tournament } from "@prisma/client";
import PreTournamentPageRender from "../../functionalComponents/client/PreTournamentPageRender";
import { getMemberFromHeaders } from "@/lib/supabase/auth-helpers";
import { getTournamentTeamData } from "@/server/actions/getTournamentTeamData";
import { getCurrentTourCard } from "@/server/actions/tourCard";
import { TournamentCountdown } from "../../TournamentCountdown";

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
  const tourCard = await getCurrentTourCard();
  // Only fetch team if tourCard exists
  const team = tourCard
    ? await getTournamentTeamData({
        tournamentId: tournament.id,
        tourCardId: tourCard.id,
      })
    : null;

  // No need for pickingTeam/setPickingTeam in server component; pass as false and a no-op
  return (
    <>
      <TournamentCountdown tourney={tournament} />
      <PreTournamentPageRender
        tournament={tournament}
        member={member}
        tourCard={tourCard}
        existingTeam={team}
        teamGolfers={team ? team.golfers : []}
      />
    </>
  );
}
