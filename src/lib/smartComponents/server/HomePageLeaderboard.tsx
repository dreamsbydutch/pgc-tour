import Link from "next/link";
import { cn } from "@pgc-utils";
import { HomePageList } from "../../components/HomePageList";
import { HomePageListSkeleton } from "../functionalComponents/loading/HomePageListSkeleton";
import { getMemberFromHeaders } from "@pgc-auth";
import LeaderboardHeaderContainer from "./LeaderboardHeaderContainer";

export default async function HomePageLeaderboard({
  tours,
  currentTournament,
  self,
  champions,
}: {
  tours: {
    id: string;
    logoUrl: string | null;
    shortForm: string;
    teams: {
      id: string;
      tourCard: { displayName: string; memberId: string };
      position: string;
      score: number;
      thru: number;
    }[];
  }[];
  currentTournament: { id: string; seasonId: string };
  self: { id: string; friends: string[] };
  champions?:
    | {
        id: number;
        tournament: {
          name: string;
          logoUrl: string | null;
          startDate: Date;
        };
      }[]
    | null;
}) {
  return (
    <div className="rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      <div className="my-3 flex items-center justify-center gap-3">
        <LeaderboardHeaderContainer focusTourney={currentTournament} />
      </div>

      <div className="grid grid-cols-2 font-varela">
        {tours.map((tour, i) => {
          const tourTeams = tour.teams.slice(0, 15).map((team) => ({
            ...team,
            id: team.id,
            displayName: team.tourCard.displayName,
            position: team.position,
            memberId: team.tourCard.memberId,
            mainStat: team.score,
            secondaryStat: team.thru,
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
                  self={self}
                  // champions={champions}
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
