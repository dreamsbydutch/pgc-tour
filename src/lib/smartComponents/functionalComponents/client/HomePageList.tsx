import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/main";
import LittleFucker from "@/lib/components/LittleFucker";
import type { ReactNode } from "react";
import { HomePageListSkeleton } from "../loading/HomePageListSkeleton";

/**
 * Generic grid component for displaying a list of tours and their teams.
 */
type HomePageListGridProps<TTour, TTeam> = {
  tours: TTour[];
  getTeams: (tour: TTour) => TTeam[];
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
  header: ReactNode;
  getLink: (tour: TTour) => string;
  getAriaLabel: (tour: TTour) => string;
};

function HomePageListGrid<TTour, TTeam>({
  tours,
  getTeams,
  self,
  champions,
  header,
  getLink,
  getAriaLabel,
}: HomePageListGridProps<TTour, TTeam>) {
  return (
    <div className="rounded-lg border border-slate-300 bg-gray-50 shadow-lg">
      <div className="my-3 flex items-center justify-center gap-3">
        {header}
      </div>
      <div className="grid grid-cols-2 font-varela">
        {tours.map((tour, i) => (
          <Link
            key={(tour as any).id ?? i}
            className={cn(
              "flex flex-col",
              i === 0 && "border-r border-slate-800",
            )}
            href={getLink(tour)}
            aria-label={getAriaLabel(tour)}
          >
            {tour ? (
              <HomePageList
                tour={tour}
                teams={getTeams(tour)}
                self={self}
                champions={champions}
              />
            ) : (
              <HomePageListSkeleton />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Standings version with explicit input types.
 */
export function HomePageStandings({
  tours,
  tourCards,
  self,
  champions,
}: {
  tours: { id: string; logoUrl: string | null; shortForm: string }[];
  tourCards: {
    id: string;
    tourId: string;
    points: number;
    earnings: number;
    position: string;
    displayName: string;
    memberId: string;
  }[];
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
    <HomePageListGrid
      tours={tours}
      getTeams={(tour) =>
        tourCards
          .filter((tc) => tc.tourId === tour.id)
          .sort((a, b) => b.points - a.points)
          .slice(0, 15)
          .map((team) => ({
            ...team,
            mainStat: team.points,
            secondaryStat: team.earnings,
          }))
      }
      self={self}
      champions={champions}
      header={
        <>
          <Image
            src="/logo512.png"
            alt="PGC Logo"
            width={56}
            height={56}
            className="h-14 w-14"
          />
          <h2 className="pb-1 font-yellowtail text-5xl sm:text-6xl md:text-7xl">
            Standings
          </h2>
        </>
      }
      getLink={(tour) => `/standings?tour=${tour.id}`}
      getAriaLabel={(tour) => `View standings for ${tour.shortForm} Tour`}
    />
  );
}

/**
 * Leaderboard version with explicit input types.
 */
export function HomePageLeaderboard({
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
    <HomePageListGrid
      tours={tours}
      getTeams={(tour) =>
        tour.teams.slice(0, 15).map((team) => ({
          ...team,
          id: team.id,
          displayName: team.tourCard.displayName,
          position: team.position,
          memberId: team.tourCard.memberId,
          mainStat: team.score,
          secondaryStat: team.thru,
        }))
      }
      self={self}
      champions={champions}
      header={
        <>
          <Image
            src="/logo512.png"
            alt="PGC Logo"
            width={56}
            height={56}
            className="h-14 w-14"
          />
          <h2 className="pb-1 font-yellowtail text-5xl sm:text-6xl md:text-7xl">
            Leaderboard
          </h2>
        </>
      }
      // header={<LeaderboardHeaderContainer focusTourney={currentTournament} />}
      getLink={(tour) =>
        `/tournament?id=${currentTournament.id}&tour=${tour.id}`
      }
      getAriaLabel={(tour) => `View leaderboard for ${tour.shortForm} Tour`}
    />
  );
}

/**
 * HomePageList component for rendering a single tour's teams.
 */
export function HomePageList({
  tour,
  teams,
  self,
  champions,
}: {
  tour: { logoUrl: string | null; shortForm: string };
  teams:
    | {
        id: number | string;
        memberId: string;
        position: string | null;
        displayName: string;
        mainStat: number | string | null;
        secondaryStat: number | string | null;
      }[]
    | null;
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
    <>
      <div className="flex items-center justify-center pb-1 pt-2 text-center text-lg font-semibold">
        <Image
          alt="Tour Logo"
          src={tour.logoUrl ?? ""}
          className="mr-2 h-8 w-8"
          width={128}
          height={128}
        />
        {tour.shortForm} Tour
      </div>
      <div className="mx-1 mb-3">
        {teams?.map((team) => (
          <SingleListing
            key={team.id}
            position={team.position}
            displayName={team.displayName}
            mainStat={team.mainStat}
            secondaryStat={team.secondaryStat}
            champions={champions ?? null}
            isSelf={self.id === team.memberId}
            isFriend={
              self.friends.some((friend) => friend === team.memberId) ?? false
            }
          />
        ))}
      </div>
    </>
  );
}

/**
 * Renders a single team listing row.
 */
function SingleListing({
  position,
  displayName,
  mainStat,
  secondaryStat,
  champions,
  isSelf,
  isFriend,
}: {
  position: string | null;
  displayName: string;
  mainStat: number | string | null;
  secondaryStat: number | string | null;
  champions:
    | {
        id: number;
        tournament: {
          name: string;
          logoUrl: string | null;
          startDate: Date;
        };
      }[]
    | null;
  isSelf: boolean;
  isFriend: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-8 items-center justify-center rounded-md text-center md:grid-cols-11 md:px-2",
        isFriend && "bg-slate-100",
        isSelf && "bg-slate-200 font-semibold",
      )}
    >
      <div className="col-span-1 place-self-center py-0.5 text-xs">
        {position}
      </div>
      <div className="col-span-5 flex items-center justify-center place-self-center py-0.5 text-sm md:col-span-6">
        {displayName}
        <LittleFucker champions={champions} showSeasonText={false} />
      </div>
      <div className="col-span-2 place-self-center py-0.5 text-sm">
        {mainStat}
      </div>
      <div className="col-span-2 hidden place-self-center py-0.5 text-sm md:block">
        {secondaryStat}
      </div>
    </div>
  );
}
