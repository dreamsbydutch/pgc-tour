import Link from "next/link";
import { cn } from "@/lib/utils/core";
import type { TourGroup } from "@/lib/types";
import { HomePageList } from "../../functionalComponents/client/HomePageList";
import { HomePageListSkeleton } from "../../functionalComponents/loading/HomePageListSkeleton";
import { getLeaderboardData } from "@/server/api/actions";
import { getMemberFromHeaders } from "@/lib/supabase/auth-helpers";
import { Tour } from "@prisma/client";
import LeaderboardHeaderContainer from "./LeaderboardHeaderContainer";

export default async function HomePageLeaderboard() {
  const { tournament, teamsByTour } = await getLeaderboardData();
  const self = await getMemberFromHeaders();

  if (!tournament || !teamsByTour?.length) return null;

  return (
    <div className="rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      <div className="my-3 flex items-center justify-center gap-3">
        <LeaderboardHeaderContainer focusTourney={tournament} />
      </div>

      <div className="grid grid-cols-2 font-varela">
        {teamsByTour.map((tourGroup: TourGroup, i: number) => {
          const tourTeams = tourGroup.teams.slice(0, 15).map((team) => ({
            ...team,
            id: team.id,
            displayName: team.tourCard.displayName,
            memberId: team.tourCard.memberId,
            mainStat: team.score,
            secondaryStat: team.thru,
          }));

          return (
            <Link
              key={tourGroup?.tour?.id ?? "tour-" + i}
              className={cn(
                "flex flex-col",
                i === 0 && "border-r border-slate-800",
              )}
              href={`/tournament?id=${tournament.id}&tour=${tourGroup?.tour?.id}`}
              aria-label={`View leaderboard for ${tourGroup?.tour?.shortForm} Tour`}
            >
              {tourGroup?.tour ? (
                <HomePageList
                  tour={tourGroup.tour as Tour}
                  teams={tourTeams}
                  seasonId={tournament.season.id}
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
