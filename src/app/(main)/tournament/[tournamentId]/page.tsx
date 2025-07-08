import { LeaderboardHeader } from "@/lib/components/functionalComponents/client/LeaderboardHeader";
import PreTournamentPage from "@/lib/components/smartComponents/server/PreTournament";
import TournamentCountdownContainer from "@/lib/components/smartComponents/server/TournamentCountdownContainer";
import { getCurrentSeason } from "@/server/actions/season";
import { getTournamentInfo } from "@/server/actions/tournament";
import { redirect } from "next/navigation";

export default async function TournamentPage({
  params,
}: {
  params: { tournamentId: string };
}) {
  const currentSeason = await getCurrentSeason();
  const { season: allTournaments } = await getTournamentInfo(
    currentSeason?.id!,
  );
  const focusTourney = allTournaments.find((t) => t.id === params.tournamentId);
  if (!focusTourney) {
    redirect("/tournament");
  }
  return (
    <div>
      <LeaderboardHeader
        {...{ focusTourney, inputTournaments: allTournaments }}
      />
      {focusTourney.startDate > new Date() && (
        <PreTournamentPage tournament={focusTourney} />
      )}
    </div>
  );
}
