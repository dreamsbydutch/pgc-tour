import Link from "next/link";
import { cn } from "@pgc-utils";
import { HomePageList } from "./HomePageList";
import { HomePageListSkeleton } from "./HomePageListSkeleton";
import {
  transformLeaderboardTeams,
  getTourLink,
  getTourAriaLabel,
} from "../utils";
import type { HomePageListingsLeaderboardProps } from "../utils/types";
import { LeaderboardHeader } from "@pgc-components/LeaderboardHeader";
import { LeaderboardHeaderSkeleton } from "src/lib/smartComponents/functionalComponents/loading/LeaderboardHeaderSkeleton";

export default function HomePageLeaderboard({
  tours,
  currentTournament,
  allTournaments,
  self,
  champions,
}: HomePageListingsLeaderboardProps) {
  return (
    <div className="rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      {currentTournament && allTournaments?.length > 0 ? (
        <LeaderboardHeader
          focusTourney={currentTournament}
          inputTournaments={allTournaments}
        />
      ) : (
        <LeaderboardHeaderSkeleton />
      )}

      <div className="grid grid-cols-2 font-varela">
        {tours.map((tour, i) => {
          // Use the utility function to transform leaderboard teams
          const tourTeams = transformLeaderboardTeams(tour.teams);

          return (
            <Link
              key={tour.id ?? "tour-" + i}
              className={cn(
                "flex flex-col",
                i === 0 && "border-r border-slate-800",
              )}
              href={getTourLink("leaderboard", tour.id, currentTournament?.id)}
              aria-label={getTourAriaLabel("leaderboard", tour.shortForm)}
            >
              {tour ? (
                <HomePageList
                  tour={tour}
                  teams={tourTeams}
                  self={self}
                  champions={champions}
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
