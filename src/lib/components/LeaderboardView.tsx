"use client";

import { type ReactElement, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import * as CountryFlags from "country-flag-icons/react/3x2";
import { MoveDownIcon, MoveHorizontalIcon, MoveUpIcon } from "lucide-react";
import {
  cn,
  filterItems,
  formatMoney,
  formatPercentage,
  formatScore,
  getGolferTeeTime,
  sortMultiple,
} from "@utils/main";
import {
  Table,
  TableRow,
} from "./smartComponents/functionalComponents/ui/table";
import { ToursToggleButton } from "./smartComponents/functionalComponents/client/ToursToggle";

// ================= EXPLICIT TYPE DEFINITIONS =================

// Core entity types
interface Course {
  id: string;
  name: string;
}

interface Tour {
  id: string;
  name: string;
  logoUrl: string | null;
  shortForm: string;
}

interface Member {
  id: string;
  role?: string | null;
  friends?: string[] | null;
}

interface TourCard {
  id: string;
  displayName: string;
  memberId: string;
  tourId: string;
  playoff: number;
}

interface Tournament {
  id: string;
  name: string;
  currentRound: number;
  course: Course | null;
}

interface Golfer {
  id: string;
  apiId: number;
  playerName: string;
  country: string | null;
  position: string | null;
  score: number | null;
  today: number | null;
  thru: number | null;
  roundOne: number | null;
  roundTwo: number | null;
  roundThree: number | null;
  roundFour: number | null;
  round: number | null;
  posChange: number | null;
  group: number | null;
  worldRank: number | null;
  rating: number | null;
  makeCut: number | null;
  topTen: number | null;
  win: number | null;
  usage: number | null;
  endHole: number | null;
}

interface Team {
  id: string;
  golferIds: number[];
  position: string | null;
  pastPosition: string | null;
  score: number | null;
  thru: number | null;
  round: number | null;
  points: number | null;
  earnings: string | null;
  tourCard: TourCard | null;
}

// Component prop types
export type LeaderboardVariant = "regular" | "historical" | "playoff";

export interface LeaderboardViewProps {
  variant: LeaderboardVariant;
  tournament: Tournament;
  tours?: Tour[];
  actualTours?: Tour[];
  tourCard?: TourCard | null;
  member?: Member | null;
  golfers: Golfer[];
  teams: Team[];
  tourCards?: TourCard[];
  inputTour?: string;
}

interface LeaderboardListingProps {
  type: "PGC" | "PGA";
  tournament: Tournament;
  tournamentGolfers: Golfer[];
  userTourCard: TourCard | null | undefined;
  golfer?: Golfer;
  team?: Team;
  tourCard?: TourCard | null;
  course?: Course | null;
  member?: Member | null;
}

// ================= HELPERS =================

interface CountryFlagItem {
  readonly key: string;
  readonly image: ReactElement;
}

const COUNTRY_FLAG_DATA: readonly CountryFlagItem[] = [
  { key: "USA", image: <CountryFlags.US /> },
  { key: "RSA", image: <CountryFlags.ZA /> },
  { key: "SWE", image: <CountryFlags.SE /> },
  { key: "KOR", image: <CountryFlags.KR /> },
  { key: "AUS", image: <CountryFlags.AU /> },
  { key: "FRA", image: <CountryFlags.FR /> },
  { key: "FIN", image: <CountryFlags.FI /> },
  { key: "JPN", image: <CountryFlags.JP /> },
  { key: "CHI", image: <CountryFlags.CN /> },
  { key: "ENG", image: <CountryFlags.GB /> },
  { key: "NOR", image: <CountryFlags.NO /> },
  { key: "ARG", image: <CountryFlags.AR /> },
  { key: "VEN", image: <CountryFlags.VE /> },
  { key: "DEN", image: <CountryFlags.DK /> },
  { key: "TPE", image: <CountryFlags.TW /> },
  { key: "CAN", image: <CountryFlags.CA /> },
  { key: "ITA", image: <CountryFlags.IT /> },
  { key: "GER", image: <CountryFlags.DE /> },
  { key: "IRL", image: <CountryFlags.IE /> },
  { key: "BEL", image: <CountryFlags.BE /> },
  { key: "COL", image: <CountryFlags.CO /> },
  { key: "PUR", image: <CountryFlags.PR /> },
  { key: "PHI", image: <CountryFlags.PH /> },
  { key: "NIR", image: <CountryFlags.GB /> },
  { key: "AUT", image: <CountryFlags.AT /> },
  { key: "SCO", image: <CountryFlags.GB /> },
] as const;

const PLAYOFF_CONFIGS = {
  gold: {
    id: "gold",
    shortForm: "Gold",
    name: "Gold Playoffs",
    logoUrl:
      "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
  },
  silver: {
    id: "silver",
    shortForm: "Silver",
    name: "Silver Playoffs",
    logoUrl:
      "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNDs7T9FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
  },
  solo: {
    id: "playoffs",
    shortForm: "Playoffs",
    name: "PGC Playoffs",
    logoUrl:
      "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
  },
  pga: {
    id: "pga",
    shortForm: "PGA",
    name: "PGA Tour",
    logoUrl:
      "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPHn0reMa1Sl6K8NiXDVstIvkZcpyWUmEoY3xj",
  },
} as const;

const SCORE_PENALTIES = {
  DQ: 999,
  WD: 888,
  CUT: 444,
} as const;

// Utility functions
const getCountryFlag = (code: string | null): ReactElement | undefined =>
  COUNTRY_FLAG_DATA.find((item: CountryFlagItem): boolean => item.key === code)
    ?.image;

const calculateScoreForSorting = (
  position: string | null,
  score: number | null,
): number => {
  if (position === "DQ") return SCORE_PENALTIES.DQ + (score ?? 999);
  if (position === "WD") return SCORE_PENALTIES.WD + (score ?? 999);
  if (position === "CUT") return SCORE_PENALTIES.CUT + (score ?? 999);
  return score ?? 999;
};

const getPositionChange = (
  team: Team | undefined,
  golfer: Golfer | undefined,
  type: "PGC" | "PGA",
): number => {
  if (type === "PGA") return golfer?.posChange ?? 0;
  if (!team?.pastPosition || !team?.position) return 0;
  return +team.pastPosition.replace("T", "") - +team.position.replace("T", "");
};

const isPlayerCut = (position: string | null): boolean =>
  ["CUT", "WD", "DQ"].includes(position ?? "");

const formatRounds = (golfer: Golfer): string =>
  [golfer.roundOne, golfer.roundTwo, golfer.roundThree, golfer.roundFour]
    .filter(Boolean)
    .join(" / ");

// Sorting functions
const sortTeams = (teams: Team[]): Team[] =>
  teams
    .sort((a, b) => (a.thru ?? 0) - (b.thru ?? 0))
    .sort(
      (a, b) =>
        calculateScoreForSorting(a.position, a.score) -
        calculateScoreForSorting(b.position, b.score),
    );

const sortGolfers = (golfers: Golfer[]): Golfer[] =>
  golfers.sort(
    (a, b) =>
      calculateScoreForSorting(a.position, a.score) -
      calculateScoreForSorting(b.position, b.score),
  );

const getSortedTeamGolfers = (
  team: Team,
  teamGolfers: Golfer[] = [],
): Golfer[] =>
  sortMultiple(
    filterItems(teamGolfers, { apiId: team.golferIds }),
    ["today", "thru", "score", "group"],
    ["asc", "asc", "asc", "asc"],
  );

// Styling functions
const getGolferRowClass = (team: Team, golfer: Golfer, i: number): string =>
  cn(
    (team.round ?? 0) >= 3 && i === 4 && "border-b border-gray-700",
    i === 9 && "border-b border-gray-700",
    isPlayerCut(golfer.position) && "text-gray-400",
  );

const getLeaderboardRowClass = (
  type: "PGC" | "PGA",
  team: Team | undefined,
  golfer: Golfer | undefined,
  tourCard: TourCard | null | undefined,
  userTourCard: TourCard | null | undefined,
  member: Member | null | undefined,
): string =>
  cn(
    "col-span-10 grid grid-flow-row grid-cols-10 py-0.5 sm:grid-cols-16",
    type === "PGC" &&
      tourCard?.id === userTourCard?.id &&
      "bg-slate-200 font-semibold",
    type === "PGC" &&
      member?.friends?.includes(tourCard?.memberId ?? "") &&
      "bg-slate-100",
    type === "PGC" && team?.position === "CUT" && "text-gray-400",
    type === "PGA" &&
      team?.golferIds?.includes(golfer?.apiId ?? 0) &&
      "bg-slate-100",
    type === "PGA" && isPlayerCut(golfer?.position ?? null) && "text-gray-400",
  );

// Custom hook for leaderboard logic
const useLeaderboardLogic = (props: LeaderboardViewProps) => {
  const { variant, tours = [], tourCards = [], inputTour = "" } = props;

  const toggleTours = useMemo(() => {
    if (variant === "playoff") {
      const maxPlayoff = Math.max(
        ...(tourCards?.map((card) => card.playoff) ?? []),
      );
      return maxPlayoff > 1
        ? [PLAYOFF_CONFIGS.gold, PLAYOFF_CONFIGS.silver, PLAYOFF_CONFIGS.pga]
        : [PLAYOFF_CONFIGS.solo, PLAYOFF_CONFIGS.pga];
    }

    return [...tours, PLAYOFF_CONFIGS.pga];
  }, [variant, tours, tourCards]);

  const defaultToggle = useMemo(() => {
    if (variant === "playoff") return "gold";
    if (inputTour) return inputTour;
    return toggleTours[0]?.id ?? "";
  }, [variant, inputTour, toggleTours]);

  return { toggleTours, defaultToggle };
};

// ================= SUBCOMPONENTS =================

const PositionChange: React.FC<{ posChange: number }> = ({ posChange }) => {
  if (posChange === 0) {
    return (
      <span className="ml-1 flex items-center justify-center text-3xs">
        <MoveHorizontalIcon className="w-2" />
      </span>
    );
  }

  const isPositive = posChange > 0;
  const Icon = isPositive ? MoveUpIcon : MoveDownIcon;
  const colorClass = isPositive ? "text-green-900" : "text-red-900";

  return (
    <span
      className={cn(
        "ml-0.5 flex items-center justify-center text-2xs",
        colorClass,
      )}
    >
      <Icon className="w-2" />
      {Math.abs(posChange)}
    </span>
  );
};

const CountryFlagDisplay: React.FC<{
  country: string | null;
  position: string | null;
}> = ({ country, position }) => (
  <div className="col-span-2 row-span-2 flex items-center justify-center text-sm font-bold">
    <div
      className={cn("w-[55%] max-w-8", isPlayerCut(position) && "opacity-40")}
    >
      {getCountryFlag(country)}
    </div>
  </div>
);

const GolferStatsGrid: React.FC<{ golfer: Golfer }> = ({ golfer }) => (
  <>
    {/* Mobile layout */}
    <div className="col-span-6 text-sm font-bold sm:hidden">Rounds</div>
    <div className="col-span-2 text-sm font-bold sm:hidden">Usage</div>
    <div className="col-span-2 text-sm font-bold sm:hidden">Group</div>
    <div className="col-span-6 text-lg sm:hidden">{formatRounds(golfer)}</div>
    <div className="col-span-2 text-lg sm:hidden">
      {Math.round((golfer.usage ?? 0) * 1000) / 10}%
    </div>
    <div className="col-span-2 text-lg sm:hidden">
      {golfer.group === 0 ? "-" : golfer.group}
    </div>

    {/* Desktop layout */}
    <div className="col-span-3 text-sm font-bold sm:col-span-2">Make Cut</div>
    <div className="col-span-3 text-sm font-bold sm:col-span-2">Top Ten</div>
    <div className="col-span-2 text-sm font-bold">Win</div>
    <div className="col-span-2 text-sm font-bold">WGR</div>
    <div className="col-span-2 text-sm font-bold">Rating</div>
    <div className="col-span-2 hidden text-sm font-bold sm:grid">Usage</div>
    <div className="col-span-2 hidden text-sm font-bold sm:grid">Group</div>

    <div className="col-span-3 text-lg sm:col-span-2">
      {Math.round((golfer.makeCut ?? 0) * 1000) / 10}%
    </div>
    <div className="col-span-3 text-lg sm:col-span-2">
      {Math.round((golfer.topTen ?? 0) * 1000) / 10}%
    </div>
    <div className="col-span-2 text-lg">
      {Math.round((golfer.win ?? 0) * 1000) / 10}%
    </div>
    <div className="col-span-2 text-lg">
      {golfer.worldRank ? `#${golfer.worldRank}` : "-"}
    </div>
    <div className="col-span-2 text-lg">{golfer.rating ?? "-"}</div>
    <div className="col-span-2 hidden text-lg sm:grid">
      {Math.round((golfer.usage ?? 0) * 1000) / 10}%
    </div>
    <div className="col-span-2 hidden text-lg sm:grid">
      {golfer.group === 0 ? "-" : golfer.group}
    </div>
  </>
);

const PGADropdown: React.FC<{ golfer: Golfer; userTeam?: Team }> = ({
  golfer,
  userTeam,
}) => {
  const isUserTeamGolfer = userTeam?.golferIds.includes(golfer.apiId);
  const isPlayerCutOrWithdrawn = isPlayerCut(golfer.position);

  return (
    <div
      className={cn(
        "col-span-10 mb-2 rounded-lg border-b border-l border-r border-slate-300 p-2 pt-1 shadow-lg",
        isUserTeamGolfer && "bg-slate-100",
        isPlayerCutOrWithdrawn && "text-gray-400",
      )}
    >
      <div className="mx-auto grid max-w-2xl grid-cols-12 sm:grid-cols-16">
        <CountryFlagDisplay
          country={golfer.country}
          position={golfer.position}
        />
        <GolferStatsGrid golfer={golfer} />
      </div>
    </div>
  );
};

const GolferScoreCell: React.FC<{ golfer: Golfer; course?: Course | null }> = ({
  golfer,
  course,
}) => {
  if (golfer.thru === 0 && course) {
    return (
      <td className="text-xs" colSpan={2}>
        {getGolferTeeTime(golfer)}
      </td>
    );
  }

  return (
    <>
      <td className="text-xs">{formatScore(golfer.today)}</td>
      <td className="text-xs">{golfer.thru === 18 ? "F" : golfer.thru}</td>
    </>
  );
};

const TeamGolfersTable: React.FC<{
  team: Team;
  teamGolfers: Golfer[] | undefined;
  course?: Course | null;
}> = ({ team, teamGolfers, course }) => {
  const sortedGolfers = getSortedTeamGolfers(team, teamGolfers);

  return (
    <Table className="scrollbar-hidden mx-auto w-full max-w-3xl border border-gray-700 text-center font-varela">
      <TableRow className="bg-gray-700 font-bold text-gray-100 hover:bg-gray-700">
        <td className="px-0.5 text-xs">Pos</td>
        <td className="px-0.5 text-xs">Player</td>
        <td className="px-0.5 text-xs">Score</td>
        <td className="px-0.5 text-2xs">Today</td>
        <td className="px-0.5 text-2xs">Thru</td>
        <td className="hidden px-0.5 text-2xs md:table-cell">R1</td>
        <td className="hidden px-0.5 text-2xs md:table-cell">R2</td>
        <td className="hidden px-0.5 text-2xs md:table-cell">R3</td>
        <td className="hidden px-0.5 text-2xs md:table-cell">R4</td>
        <td className="hidden px-0.5 text-2xs xs:table-cell">Make Cut</td>
        <td className="hidden px-0.5 text-2xs xs:table-cell">Usage</td>
        <td className="px-0.5 text-2xs">Group</td>
      </TableRow>
      {sortedGolfers.map((golfer, i) => (
        <TableRow
          key={golfer.id}
          className={getGolferRowClass(team, golfer, i)}
        >
          <td className="px-1 text-xs">{golfer.position}</td>
          <td className="whitespace-nowrap px-1 text-sm">
            {golfer.playerName}
          </td>
          <td className="px-1 text-sm">{formatScore(golfer.score)}</td>
          <GolferScoreCell golfer={golfer} course={course} />
          <td className="hidden border-l border-gray-300 text-xs md:table-cell">
            {golfer.roundOne ?? "-"}
          </td>
          <td className="hidden border-gray-300 text-xs md:table-cell">
            {golfer.roundTwo ?? "-"}
          </td>
          <td className="hidden border-gray-300 text-xs md:table-cell">
            {golfer.roundThree ?? "-"}
          </td>
          <td className="hidden border-gray-300 text-xs md:table-cell">
            {golfer.roundFour ?? "-"}
          </td>
          <td className="hidden border-l border-gray-300 text-xs xs:table-cell">
            {golfer.makeCut === 0
              ? "-"
              : formatPercentage(golfer.makeCut, false)}
          </td>
          <td className="hidden border-gray-300 text-xs xs:table-cell">
            {formatPercentage(golfer.usage, false)}
          </td>
          <td className="border-gray-300 text-xs">{golfer.group}</td>
        </TableRow>
      ))}
    </Table>
  );
};

const LeaderboardHeaderRow: React.FC<{
  tournamentOver: boolean;
  activeTour: string;
}> = ({ tournamentOver, activeTour }) => (
  <div className="mx-auto grid max-w-4xl grid-flow-row grid-cols-10 text-center sm:grid-cols-16">
    <div className="col-span-2 place-self-center font-varela text-sm font-bold sm:col-span-3">
      Rank
    </div>
    <div className="col-span-4 place-self-center font-varela text-base font-bold">
      Name
    </div>
    <div className="col-span-2 place-self-center font-varela text-sm font-bold">
      Score
    </div>
    <div className="col-span-1 place-self-center font-varela text-2xs">
      {tournamentOver ? (activeTour === "PGA" ? "Group" : "Points") : "Today"}
    </div>
    <div className="col-span-1 place-self-center font-varela text-2xs">
      {tournamentOver ? (activeTour === "PGA" ? "Rating" : "Earnings") : "Thru"}
    </div>
    <div className="col-span-1 hidden place-self-center font-varela text-2xs sm:flex">
      R1
    </div>
    <div className="col-span-1 hidden place-self-center font-varela text-2xs sm:flex">
      R2
    </div>
    <div className="col-span-1 hidden place-self-center font-varela text-2xs sm:flex">
      R3
    </div>
    <div className="col-span-1 hidden place-self-center font-varela text-2xs sm:flex">
      R4
    </div>
  </div>
);

const ScoreDisplay: React.FC<{
  type: "PGC" | "PGA";
  team?: Team;
  golfer?: Golfer;
  course?: Course | null;
}> = ({ type, team, golfer, course }) => {
  const isPlayerCutOrWithdrawn =
    isPlayerCut(team?.position ?? null) ||
    isPlayerCut(golfer?.position ?? null);
  const isTournamentOver = team?.round === 5 || golfer?.round === 5;

  if (isPlayerCutOrWithdrawn) {
    return <div className="col-span-2 sm:col-span-3" />;
  }

  if (isTournamentOver) {
    return (
      <>
        <div className="col-span-1 place-self-center font-varela text-sm">
          {type === "PGA"
            ? golfer?.group === 0
              ? "-"
              : golfer?.group
            : team?.points === 0
              ? "-"
              : team?.points}
        </div>
        <div className="col-span-1 place-self-center whitespace-nowrap font-varela text-sm sm:col-span-2 sm:hidden">
          {type === "PGA"
            ? golfer?.rating
            : formatMoney(+(team?.earnings ?? 0), true)}
        </div>
        <div className="col-span-1 hidden place-self-center whitespace-nowrap font-varela text-sm sm:col-span-2 sm:inline-block">
          {type === "PGA"
            ? golfer?.rating
            : formatMoney(+(team?.earnings ?? 0))}
        </div>
      </>
    );
  }

  if (type === "PGA") {
    if (!golfer?.thru || golfer?.thru === 0) {
      return (
        <div className="col-span-2 place-self-center font-varela text-xs">
          {course && golfer ? getGolferTeeTime(golfer) : null}
          {golfer?.endHole === 9 ? "*" : ""}
        </div>
      );
    }

    return (
      <>
        <div className="col-span-1 place-self-center font-varela text-sm">
          {golfer?.today !== null ? formatScore(golfer?.today) : "-"}
        </div>
        <div className="col-span-1 place-self-center font-varela text-sm">
          {golfer?.thru === 18 ? "F" : golfer?.thru}
        </div>
      </>
    );
  }

  return (
    <div className="col-span-2 place-self-center font-varela text-xs">
      {team?.round === 5
        ? "-"
        : team?.round === 4
          ? "F"
          : team?.thru === 18
            ? "F"
            : team?.thru}
    </div>
  );
};

const LeaderboardListing: React.FC<LeaderboardListingProps> = ({
  type,
  tournament,
  tournamentGolfers,
  userTourCard,
  golfer,
  team,
  tourCard,
  course,
  member,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  if (!team && !golfer) return null;

  const posChange = getPositionChange(team, golfer, type);
  const shouldShowPositionChange =
    (tournament?.currentRound ?? 0) > 1 &&
    !isPlayerCut(team?.position ?? null) &&
    !isPlayerCut(golfer?.position ?? null);

  const rowClass = getLeaderboardRowClass(
    type,
    team,
    golfer,
    tourCard,
    userTourCard,
    member,
  );

  return (
    <div
      key={team?.id ?? golfer?.apiId}
      onClick={handleToggle}
      className="mx-auto my-0.5 grid max-w-4xl cursor-pointer grid-flow-row grid-cols-10 rounded-md text-center"
    >
      <div className={rowClass}>
        <div className="col-span-2 flex place-self-center font-varela text-base sm:col-span-3">
          {type === "PGA" ? golfer?.position : team?.position}
          {shouldShowPositionChange && <PositionChange posChange={posChange} />}
        </div>

        <div className="col-span-4 place-self-center font-varela text-lg">
          {type === "PGA" ? golfer?.playerName : tourCard?.displayName}
        </div>

        <div className="col-span-2 place-self-center font-varela text-base">
          {type !== "PGA" && team?.position === "CUT"
            ? "-"
            : formatScore((type === "PGA" ? golfer?.score : team?.score) ?? 0)}
        </div>

        <ScoreDisplay type={type} team={team} golfer={golfer} course={course} />
      </div>

      {isOpen && (
        <div className="col-span-10 mx-auto mb-2 w-full max-w-4xl rounded-md border border-gray-300 bg-white shadow-md">
          {type === "PGA" ? (
            <PGADropdown golfer={golfer!} userTeam={team} />
          ) : (
            <TeamGolfersTable
              team={team!}
              teamGolfers={tournamentGolfers}
              course={course}
            />
          )}
        </div>
      )}
    </div>
  );
};
// ================= MAIN COMPONENT =================

const LeaderboardView: React.FC<LeaderboardViewProps> = (props) => {
  const { member, tournament, golfers, teams, tourCard } = props;
  const { toggleTours, defaultToggle } = useLeaderboardLogic(props);
  const [activeTour, setActiveTour] = useState<string>(defaultToggle);

  const renderPGARows = useCallback(() => {
    return sortGolfers(golfers ?? []).map((golfer) => (
      <LeaderboardListing
        key={golfer.id}
        type="PGA"
        tournament={tournament}
        tournamentGolfers={golfers}
        userTourCard={tourCard}
        golfer={golfer}
      />
    ));
  }, [golfers, tournament, tourCard]);

  const renderPlayoffRows = useCallback(() => {
    const playoffLevel =
      activeTour === "gold" ? 1 : activeTour === "silver" ? 2 : 1;

    return sortTeams(teams ?? [])
      .filter((team) => team.tourCard?.playoff === playoffLevel)
      .map((team) => (
        <LeaderboardListing
          key={team.id}
          type="PGC"
          tournament={tournament}
          tournamentGolfers={golfers}
          tourCard={team.tourCard}
          userTourCard={tourCard}
          team={team}
          member={member}
        />
      ));
  }, [teams, activeTour, tournament, golfers, tourCard, member]);

  const renderRegularRows = useCallback(() => {
    return sortTeams(teams ?? [])
      .filter((team) => team.tourCard?.tourId === activeTour)
      .map((team) => (
        <LeaderboardListing
          key={team.id}
          type="PGC"
          tournament={tournament}
          tournamentGolfers={golfers}
          tourCard={team.tourCard}
          userTourCard={tourCard}
          team={team}
          member={member}
        />
      ));
  }, [teams, activeTour, tournament, golfers, tourCard, member]);

  const renderRows = useCallback(() => {
    const activeShortForm = toggleTours.find(
      (tour: Tour) => tour.id === activeTour,
    )?.shortForm;

    if (activeShortForm === "PGA") return renderPGARows();
    if (props.variant === "playoff") return renderPlayoffRows();
    return renderRegularRows();
  }, [
    toggleTours,
    activeTour,
    props.variant,
    renderPGARows,
    renderPlayoffRows,
    renderRegularRows,
  ]);

  const isTournamentOver = tournament.currentRound === 5;
  const activeTourShortForm =
    toggleTours.find((tour: Tour) => tour.id === activeTour)?.shortForm ?? "";
  const showNoTourMessage = !toggleTours.find(
    (tour: Tour) => tour.id === activeTour,
  );

  return (
    <div className="mx-auto mt-2 w-full max-w-4xl md:w-11/12 lg:w-8/12">
      {/* Admin-only tournament stats link */}
      {member?.role === "admin" && (
        <Link
          className="mb-8 flex w-fit flex-row items-center justify-center self-start rounded-md border border-gray-400 px-2 py-0.5"
          href={`/tournament/${tournament.id}/stats`}
        >
          Tournament Stats
        </Link>
      )}

      {/* Tour toggle buttons */}
      <div className="mx-auto my-4 flex w-full max-w-xl items-center justify-center gap-4">
        {toggleTours.map((tour: Tour) => (
          <ToursToggleButton
            key={tour.id}
            tour={{ ...tour, logoUrl: tour.logoUrl ?? "" }}
            tourToggle={activeTour}
            setTourToggle={setActiveTour}
          />
        ))}
      </div>

      {/* Leaderboard content */}
      <div>
        <LeaderboardHeaderRow
          tournamentOver={isTournamentOver}
          activeTour={activeTourShortForm}
        />
        {renderRows()}
        {showNoTourMessage && (
          <div className="py-4 text-center text-lg font-bold">
            Choose a tour using the toggle buttons
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardView;
