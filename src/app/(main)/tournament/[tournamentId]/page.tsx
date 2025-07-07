import { LeaderboardHeader } from "@/lib/components/functionalComponents/client/LeaderboardHeader";
import TournamentCountdownContainer from "@/lib/components/smartComponents/server/TournamentCountdownContainer";
import { getTournamentData } from "@/server/api/actions";
import { redirect } from "next/navigation";

export default async function TournamentPage({
  params,
}: {
  params: { tournamentId: string };
}) {
  const { all: allTournaments, currentSeason } = await getTournamentData();
  const focusTourney = allTournaments.find((t) => t.id === params.tournamentId);
  if (!focusTourney) {
    redirect("/tournament");
  }
  return (
    <div>
      <LeaderboardHeader
        {...{ focusTourney, inputTournaments: currentSeason }}
      />
      {focusTourney.startDate > new Date() && (
        <TournamentCountdownContainer inputTourney={focusTourney} />
      )}
      {/* <PreTournamentPageRender
        tournament={focusTourney}
        member={member}
        tourCard={tourCard}
        existingTeam={existingTeam}
        teamGolfers={teamGolfers}
        isTeamLoading={isTeamLoading}
        teamError={teamError as string | null}
        pickingTeam={false}
      /> */}
    </div>
  );
}
