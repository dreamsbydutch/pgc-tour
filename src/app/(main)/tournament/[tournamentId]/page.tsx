// import PreTournamentPage from "@/lib/components/smartComponents/server/PreTournament";
import { getMemberFromHeaders } from "@pgc-auth";
import { LeaderboardHeader } from "@pgc-components";
import { LeaderboardView } from "@pgc-components/LeaderboardView";
import { PreTournamentPage } from "@pgc-components/PreTournament";
import {
  getCompleteLeaderboardData,
  getCurrentSeason,
  getTournamentInfo,
} from "@pgc-serverActions";
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

  // Calculate if tournament is in the future once
  const now = new Date();
  const isPreTournament = focusTourney.startDate > now;

  // Fetch all leaderboard data using the new server action
  let leaderboardData;
  try {
    leaderboardData = await getCompleteLeaderboardData({
      tournamentId: focusTourney.id,
      userId: user?.id,
    });
  } catch (error) {
    console.error("Failed to fetch leaderboard data:", error);
    // Return a basic error page instead of crashing
    return (
      <div>
        <LeaderboardHeader
          focusTourney={focusTourney}
          inputTournaments={allTournaments}
        />
        <div className="py-8 text-center">
          <div className="text-lg text-red-600">
            Unable to load tournament data
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Please try refreshing the page or check back later.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <LeaderboardHeader
        focusTourney={focusTourney}
        inputTournaments={allTournaments}
      />
      {isPreTournament && <PreTournamentPage tournament={focusTourney} />}
      {!isPreTournament && (
        <LeaderboardView
          tournamentId={leaderboardData.tournament.id}
          userId={user?.id}
          variant="regular"
        />
      )}
      {leaderboardData.teams.length === 0 &&
        leaderboardData.golfers.length === 0 && (
          <div className="py-8 text-center">
            <div className="text-lg text-gray-600">
              No leaderboard data available yet.
            </div>
            <div className="mt-2 text-sm text-gray-500">
              Tournament data will appear once scoring begins.
            </div>
          </div>
        )}
    </div>
  );
}
