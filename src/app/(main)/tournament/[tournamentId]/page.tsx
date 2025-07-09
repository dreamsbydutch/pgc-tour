import { LeaderboardHeader } from "@/lib/components/smartComponents/functionalComponents/client/LeaderboardHeader";
import PreTournamentPage from "@/lib/components/smartComponents/server/PreTournament";
import { getCurrentSeason } from "@/server/actions/season";
import { getTeamsByTournament } from "@/server/actions/team";
import { getTiersBySeason } from "@/server/actions/tier";
import { getToursBySeason } from "@/server/actions/tour";
import { getAllTourCards, getCurrentTourCard } from "@/server/actions/tourCard";
import { getTournamentInfo } from "@/server/actions/tournament";
import { redirect } from "next/navigation";

export default async function TournamentPage({
  params,
}: {
  params: { tournamentId: string };
}) {
  const currentSeason = await getCurrentSeason();
  const { season: allTournaments } = await getTournamentInfo(currentSeason?.id??"");
  const focusTourney = allTournaments.find((t) => t.id === params.tournamentId);

  const golfers = await getGolfersByTournament(focusTourney?.id ?? "");
  const teams = await getTeamsByTournament(focusTourney?.id ?? "");
  const tours = await getToursBySeason(currentSeason.id);
  const tourCards = await getAllTourCards();
  const member = await getMemberFromHeaders();
  const tourCard = await getCurrentTourCard();

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
      <LeaderboardView
        tournament={focusTourney}
        golfers={golfers}
        teams={teams}
        tours={tours}
        tourCards={tourCards}
        member={member}
        tourCard={tourCard}
        variant="historical"
      />
    </div>
  );
}
