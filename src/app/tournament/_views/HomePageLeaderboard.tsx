import type { TeamData, TournamentData } from "@/src/types/prisma_include";
import { api } from "@/src/trpc/server";
import { cn, formatScore } from "@/src/lib/utils";
import Link from "next/link";
import Image from "next/image";
import LeaderboardHeader from "../_components/header/LeaderboardHeader";

/**
 * HomePageLeaderboard Component
 *
 * Displays the leaderboard for the homepage, showing the top teams for two tours.
 * - Fetches and displays data for the "CCG" and "DbyD" tours.
 * - Includes links to the full leaderboard for each tour.
 *
 * Props:
 * - tourney: The current tournament data (optional).
 * - season: The current season data (optional).
 */
export default async function HomePageLeaderboard({
  tourney,
  seasonId,
}: {
  tourney?: TournamentData;
  seasonId?: string;
}) {
  if (!tourney || !seasonId) return null;

  const tours = await api.tour.getActive();
  const teams = await api.team.getByTournament({ tournamentId: tourney.id });

  // Filter and sort teams for the "CCG" and "DbyD" tours
  const ccgTeams = getTopTeams(teams, tours, "CCG");
  const dbydTeams = getTopTeams(teams, tours, "DbyD");

  return (
    <div className="m-1 rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      {/* Leaderboard Header */}
      <LeaderboardHeader {...{ focusTourney: tourney }} />
      <div className="grid grid-cols-2 font-varela">
        {[ccgTeams, dbydTeams].map((tour, i) => {
          const tourInfo = tours.find((t) => t.id === tour[0]?.tourCard.tourId);
          return (
            <Link
              key={tourInfo?.id}
              className={cn(
                "flex flex-col",
                i === 0 && "border-r border-slate-800",
              )}
              href={`/tournament/${tourney.id}?tour=${tourInfo?.id}`}
            >
              <TourSection {...{ tour, tourInfo }} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * getTopTeams Function
 *
 * Filters and sorts the top teams for a specific tour.
 *
 * @param teams - The list of all teams in the tournament.
 * @param tours - The list of active tours.
 * @param shortForm - The short form of the tour (e.g., "CCG", "DbyD").
 * @returns The top 15 teams for the specified tour.
 */
function getTopTeams(
  teams: TeamData[],
  tours: { id: string; shortForm: string }[],
  shortForm: string,
) {
  return teams
    .filter(
      (team) =>
        team.tourCard.tourId ===
        tours.find((tour) => tour.shortForm === shortForm)?.id,
    )
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
    .slice(0, 15);
}

/**
 * TourSection Component
 *
 * Displays the leaderboard section for a specific tour.
 * - Includes the tour logo, name, and a list of top teams.
 *
 * Props:
 * - tour: The list of teams for the tour.
 * - tourInfo: The tour information (e.g., name, logo).
 */
function TourSection({
  tour,
  tourInfo,
}: {
  tour: TeamData[];
  tourInfo?: { id: string; logoUrl: string; shortForm: string };
}) {
  return (
    <>
      <div className="flex items-center justify-center pb-1 pt-2 text-center text-lg font-semibold">
        <Image
          alt="Tour Logo"
          src={tourInfo?.logoUrl ?? ""}
          className="mr-2 h-8 w-8"
          width={128}
          height={128}
        />
        {tourInfo?.shortForm} Tour
      </div>
      <div className="mx-1 mb-3">
        {tour.map((team) => (
          <TeamListing key={team.id} {...{ team }} />
        ))}
      </div>
    </>
  );
}

/**
 * TeamListing Component
 *
 * Displays a single team in the leaderboard.
 * - Highlights the user's team and their friends' teams.
 *
 * Props:
 * - team: The team data to display.
 */
async function TeamListing({ team }: { team: TeamData }) {
  const self = await api.member.getSelf();

  return (
    <div
      className={cn(
        self?.friends.includes(team.tourCard.memberId) && "bg-slate-100",
        self?.id === team.tourCard.memberId && "bg-slate-200 font-semibold",
        "grid grid-cols-8 items-center justify-center rounded-md text-center",
      )}
    >
      {/* Team Position */}
      <div className="col-span-1 place-self-center py-0.5 text-center text-xs">
        {team.position}
      </div>

      {/* Team Name */}
      <div className="col-span-5 place-self-center py-0.5 text-center text-sm">
        {team?.tourCard.displayName}
      </div>

      {/* Team Score */}
      <div className="col-span-2 place-self-center py-0.5 text-center text-sm">
        {formatScore(team.score)}
      </div>
    </div>
  );
}
