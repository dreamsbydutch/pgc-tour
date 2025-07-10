import type { Tournament } from "@prisma/client";
import PreTournamentPageRender from "../functionalComponents/client/PreTournamentPageRender";
import { getMemberFromHeaders } from "@auth/utils";
import { getTournamentTeamData } from "@server/actions/getTournamentTeamData";
import { getCurrentTourCard } from "@server/actions/tourCard";
import { TournamentCountdown } from "../../components/TournamentCountdown";

export default async function PreTournamentPage({
  tournament,
}: {
  tournament: Pick<
    Tournament,
    "id" | "name" | "logoUrl" | "startDate" | "seasonId"
  >;
}) {
  try {
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
        <TournamentCountdownContainer inputTourney={tournament} />
        <PreTournamentPageRender
          tournament={tournament}
          member={member}
          tourCard={tourCard}
          existingTeam={team}
          teamGolfers={team?.golfers ?? []}
        />
      </>
    );
  } catch (error) {
    console.error("Error in PreTournamentPage:", error);

    // Return a fallback UI if there's an error
    return (
      <>
        <TournamentCountdownContainer inputTourney={tournament} />
        <PreTournamentPageRender
          tournament={tournament}
          member={null}
          tourCard={null}
          existingTeam={null}
          teamGolfers={[]}
        />
      </>
    );
  }
}
