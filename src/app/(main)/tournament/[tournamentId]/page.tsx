import { getMemberFromHeaders } from "@/lib/auth";
import LeaderboardView from "@/lib/components/LeaderboardView";
import { LeaderboardHeader } from "@/lib/components/smartComponents/functionalComponents/client/LeaderboardHeader";
import PreTournamentPage from "@/lib/components/smartComponents/server/PreTournament";
import { getCompleteLeaderboardData } from "@/server/actions/leaderboard-complete";
import { getCurrentSeason } from "@/server/actions/season";
import { getTournamentInfo } from "@/server/actions/tournament";
import { redirect } from "next/navigation";

export default async function TournamentPage({
  params,
}: {
  params: { tournamentId: string };
}) {
  const user = await getMemberFromHeaders();
  const currentSeason = await getCurrentSeason();
  const { season: allTournaments } = await getTournamentInfo(
    currentSeason?.id ?? "",
  );
  const focusTourney = allTournaments.find((t) => t.id === params.tournamentId);

  if (!focusTourney) {
    redirect("/tournament");
  }

  // Fetch all leaderboard data using the new server action
  const leaderboardData = await getCompleteLeaderboardData({
    tournamentId: focusTourney.id,
    userId: user?.id,
  });

  return (
    <div>
      <LeaderboardHeader
        focusTourney={focusTourney}
        inputTournaments={allTournaments}
      />
      {focusTourney.startDate > new Date() && (
        <PreTournamentPage tournament={focusTourney} />
      )}
      {focusTourney.startDate <= new Date() &&
        leaderboardData.teams.length > 0 && (
          <LeaderboardView {...leaderboardData} />
        )}
    </div>
  );
}
