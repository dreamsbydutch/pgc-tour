import Link from "next/link";
import { cn, formatScore } from "@/lib/utils/main";
import { HomePageList } from "../functionalComponents/client/HomePageList";
import { HomePageListSkeleton } from "../functionalComponents/loading/HomePageListSkeleton";
import { getMemberFromHeaders } from "@/lib/auth/utils";
import LeaderboardHeaderContainer from "./LeaderboardHeaderContainer";
import { getLeaderboardData } from "@/server/actions/leaderboard";

export default async function HomePageLeaderboard() {
  const { currentTournament, tours } = await getLeaderboardData();
  const self = await getMemberFromHeaders();

  if (!currentTournament || !tours?.length) return null;

  return (
    <div className="rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      <div className="my-3 flex items-center justify-center gap-3">
        <LeaderboardHeaderContainer focusTourney={currentTournament} />
      </div>

      <div className="grid grid-cols-2 font-varela">
        {tours.map((tour, i) => {
          const tourTeams = tour.teams
            .sort((a, b) => (a.score ?? 999) - (b.score ?? 999))
            .slice(0, 15)
            .map((team) => ({
              ...team,
              id: team.id,
              displayName: team.tourCard.displayName,
              memberId: team.tourCard.memberId,
              mainStat: formatScore(team.score),
              secondaryStat:
                team.thru === 0 ? "-" : team.thru === 18 ? "F" : team.thru,
            }));

          return (
            <Link
              key={tour.id ?? "tour-" + i}
              className={cn(
                "flex flex-col",
                i === 0 && "border-r border-slate-800",
              )}
              href={`/tournament?id=${currentTournament.id}&tour=${tour.id}`}
              aria-label={`View leaderboard for ${tour.shortForm} Tour`}
            >
              {tour ? (
                <HomePageList
                  tour={tour}
                  teams={tourTeams}
                  seasonId={currentTournament.seasonId}
                  self={self}
                />
              ) : (
                <HomePageListSkeleton />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
