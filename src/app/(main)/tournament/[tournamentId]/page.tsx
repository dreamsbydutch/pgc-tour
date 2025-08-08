// import PreTournamentPage from "@/lib/components/smartComponents/server/PreTournament";
import { getMemberFromHeaders } from "@pgc-auth";
import { LeaderboardHeader } from "@pgc-components";
import dynamic from "next/dynamic";
import { PreTournamentPage } from "@pgc-components/PreTournament";
import { getCurrentSeason, getTournamentInfo } from "@pgc-serverActions";
import { redirect } from "next/navigation";
import { api } from "@pgc-trpcServer";

// Load LeaderboardView client-side only to avoid hydration issues
const LeaderboardView = dynamic(
  () =>
    import("@pgc-components/LeaderboardView").then((mod) => ({
      default: mod.LeaderboardView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg">
          <div className="text-center">
            {/* Loading spinner */}
            <div className="mb-6 flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600"></div>
            </div>

            {/* Main loading message */}
            <h2 className="mb-3 font-yellowtail text-3xl text-slate-800">
              Loading Leaderboard
            </h2>

            {/* Subtitle */}
            <p className="font-varela text-sm text-slate-600">
              Gathering the latest tournament scores and standings...
            </p>

            {/* Animated dots */}
            <div className="mt-4 flex justify-center space-x-1">
              <div className="h-2 w-2 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-slate-600"></div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
);

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
  const focusTourneyTeams = await api.team.getByTournament({
    tournamentId: focusTourney?.id ?? "",
  });
  const currentTeam = focusTourneyTeams.find(
    (t) => t.tourCard.memberId === user?.id,
  );

  if (!focusTourney) {
    redirect("/tournament");
  }

  // Calculate if tournament is in the future once
  const now = new Date();
  const isPreTournament = focusTourney.startDate > now;

  return (
    <div>
      <LeaderboardHeader
        focusTourney={focusTourney}
        inputTournaments={allTournaments}
      />
      {(isPreTournament || currentTeam?.golferIds.length === 0) && (
        <PreTournamentPage tournament={focusTourney} />
      )}
      {!isPreTournament && (
        <LeaderboardView
          tournamentId={focusTourney.id}
          userId={user?.id}
          variant="regular"
          isPreTournament={isPreTournament}
        />
      )}
    </div>
  );
}
