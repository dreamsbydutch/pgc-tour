"use client";

import type {
  Course,
  Golfer,
  Member,
  Team,
  Tour,
  TourCard,
  Tournament,
} from "@prisma/client";
import { useState } from "react";
import Link from "next/link";
import { ToursToggleButton } from "@/lib/components/functionalComponents/client/ToursToggle";
import {
  US,
  SE,
  ZA,
  KR,
  AT,
  AU,
  AR,
  IT,
  DE,
  IE,
  BE,
  CO,
  PR,
  PH,
  VE,
  DK,
  FR,
  FI,
  CN,
  JP,
  NO,
  GB,
  CA,
  TW,
} from "country-flag-icons/react/3x2";
import { MoveDownIcon, MoveHorizontalIcon, MoveUpIcon } from "lucide-react";
import { formatScore, getGolferTeeTime } from "@utils/domain/golf";
import { formatPercentage, formatMoney } from "@utils/domain/formatting";
import { filterItems } from "@utils/data/processing";
import { sortMultiple } from "@utils/data/sorting";
import { cn } from "@utils/core";
import {
  Table,
  TableRow,
} from "@/lib/components/functionalComponents/ui/table";

/**
 * Unified LeaderboardPage Component
 *
 * Props:
 * - variant: 'regular' | 'historical' | 'playoff'
 * - tournament: The tournament data.
 * - tours: The list of tours available for the tournament (for regular/historical).
 * - actualTours: The list of actual tours (for playoff).
 * - tourCard (optional): The user's tour card data.
 * - member (optional): The current member (user) data.
 * - golfers: The list of golfers for the tournament.
 * - teams: The list of teams for the tournament.
 * - tourCards: All tour cards for playoff logic (optional).
 * - inputTour: The initial active tour ID.
 */
export type LeaderboardVariant = "regular" | "historical" | "playoff";

// --- Types ---
export type LeaderboardCourse = Omit<
  Course,
  "createdAt" | "updatedAt" | "location" | "apiId"
>;

export type LeaderboardTour = Omit<
  Tour,
  "createdAt" | "updatedAt" | "buyIn" | "playoffSpots" | "seasonId"
>;

export type LeaderboardGolfer = Omit<
  Golfer,
  "createdAt" | "updatedAt" | "earnings" | "tournamentId"
>;

export type LeaderboardTeam = Omit<
  Team,
  | "createdAt"
  | "updatedAt"
  | "win"
  | "topTen"
  | "topThree"
  | "tournamentId"
  | "tourCardId"
  | "makeCut"
> & { tourCard: LeaderboardTourCard | null };

export type LeaderboardTourCard = Omit<
  TourCard,
  | "createdAt"
  | "updatedAt"
  | "earnings"
  | "points"
  | "win"
  | "topTen"
  | "madeCut"
  | "appearances"
  | "position"
>;

export type LeaderboardMember = Omit<
  Member,
  "createdAt" | "updatedAt" | "firstname" | "lastname" | "email" | "account"
>;

export type LeaderboardTournament = Omit<
  Tournament,
  "createdAt" | "updatedAt"
> & { course: LeaderboardCourse | null };

export interface LeaderboardViewProps {
  variant: LeaderboardVariant;
  tournament: LeaderboardTournament;
  tours?: LeaderboardTour[];
  actualTours?: LeaderboardTour[];
  tourCard?: LeaderboardTourCard | null;
  member?: LeaderboardMember | null;
  golfers: LeaderboardGolfer[];
  teams: LeaderboardTeam[];
  tourCards?: LeaderboardTourCard[];
  inputTour?: string;
}

export interface LeaderboardListingProps {
  type: "PGC" | "PGA";
  tournament: LeaderboardTournament;
  tournamentGolfers: LeaderboardGolfer[];
  userTourCard: LeaderboardTourCard | null | undefined;
  golfer?: LeaderboardGolfer;
  team?: LeaderboardTeam;
  tourCard?: LeaderboardTourCard | null;
  course?: LeaderboardCourse | null;
  teamGolfers?: LeaderboardGolfer[];
  member?: LeaderboardMember | null;
}

export default function LeaderboardView(props: LeaderboardViewProps) {
  const { member, tournament, golfers, teams, tourCard } = props;
  const { toggleTours, defaultToggle } = useLeaderboardLogic(props);
  const [activeTour, setActiveTour] = useState<string>(defaultToggle);

  // --- Render helpers ---
  const renderRows = () => {
    const activeShortForm = toggleTours.find(
      (tour) => tour.id === activeTour,
    )?.shortForm;
    if (activeShortForm === "PGA") {
      return sortGolfersForSpecialPositions(golfers ?? []).map((golfer) => (
        <LeaderboardListing
          key={golfer.id}
          {...{
            type: "PGA",
            tournament,
            tournamentGolfers: golfers,
            tourCard,
            userTourCard: tourCard,
            golfer,
          }}
        />
      ));
    }
    if (props.variant === "playoff") {
      return sortTeamsForSpecialPositions(teams ?? [])
        .filter(
          (t) =>
            t.tourCard?.playoff ===
            (activeTour === "gold" ? 1 : activeTour === "silver" ? 2 : 1),
        )
        .map((team) => (
          <LeaderboardListing
            key={team.id}
            {...{
              type: "PGC",
              tournament,
              tournamentGolfers: golfers,
              tourCard,
              userTourCard: tourCard,
              team,
            }}
          />
        ));
    }
    return sortTeamsForSpecialPositions(teams ?? [])
      .filter((team) => team.tourCard?.tourId === activeTour)
      .map((team) => (
        <LeaderboardListing
          key={team.id}
          {...{
            type: "PGC",
            tournament,
            tournamentGolfers: golfers,
            tourCard,
            userTourCard: tourCard,
            team,
          }}
        />
      ));
  };

  return (
    <div className="mx-auto mt-2 w-full max-w-4xl md:w-11/12 lg:w-8/12">
      {/* Admin-only link to tournament stats */}
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
        {toggleTours.map((tour) => (
          <ToursToggleButton
            key={tour.id}
            tour={tour}
            tourToggle={activeTour}
            setTourToggle={setActiveTour}
          />
        ))}
      </div>
      {/* Leaderboard content */}
      <div>
        <LeaderboardHeaderRow
          {...{
            tournamentOver: tournament.currentRound === 5,
            activeTour:
              toggleTours.find((tour) => tour.id === activeTour)?.shortForm ??
              "",
          }}
        />
        {renderRows()}
        {toggleTours.find((tour) => tour.id === activeTour) == null && (
          <div className="py-4 text-center text-lg font-bold">
            Choose a tour using the toggle buttons
          </div>
        )}
      </div>
    </div>
  );
}

// --- Logic helpers ---
function useLeaderboardLogic(props: LeaderboardViewProps) {
  const {
    variant,
    tournament,
    tours = [],
    actualTours = [],
    tourCard,
    golfers,
    teams,
    tourCards = [],
    inputTour = "",
  } = props;

  let toggleTours: LeaderboardTour[] = [];
  let playoffKey = "gold";
  if (variant === "playoff") {
    const goldPlayoff: LeaderboardTour = {
      id: "gold",
      shortForm: "Gold",
      name: "Gold Playoffs",
      logoUrl:
        "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
    };
    const silverPlayoff: LeaderboardTour = {
      id: "silver",
      shortForm: "Silver",
      name: "Silver Playoffs",
      logoUrl:
        "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNDs7T9FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
    };
    const soloPlayoff: LeaderboardTour = {
      id: "playoffs",
      shortForm: "Playoffs",
      name: "PGC Playoffs",
      logoUrl:
        "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
    };
    const pgaPlayoff: LeaderboardTour = {
      id: "pga",
      shortForm: "PGA",
      name: "PGA Tour",
      logoUrl:
        "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPHn0reMa1Sl6K8NiXDVstIvkZcpyWUmEoY3xj",
    };
    const maxPlayoff = Math.max(...(tourCards?.map((a) => a.playoff) ?? []));
    toggleTours =
      maxPlayoff > 1
        ? [goldPlayoff, silverPlayoff, pgaPlayoff]
        : [soloPlayoff, pgaPlayoff];
  } else {
    toggleTours = [
      ...(tours ?? []),
      {
        id: "pga",
        shortForm: "PGA",
        name: "PGA Tour",
        logoUrl:
          "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPHn0reMa1Sl6K8NiXDVstIvkZcpyWUmEoY3xj",
      },
    ];
  }

  let defaultToggle = "";
  if (variant === "playoff") {
    defaultToggle = playoffKey;
  } else if (inputTour && inputTour !== "") {
    defaultToggle = inputTour;
  } else if (toggleTours && toggleTours.length > 0) {
    defaultToggle = toggleTours?.[0]?.id ?? "";
  }

  return { toggleTours, defaultToggle };
}

// --- Utility and helper functions ---
const countryFlags = [
  { key: "USA", image: <US /> },
  { key: "RSA", image: <ZA /> },
  { key: "SWE", image: <SE /> },
  { key: "KOR", image: <KR /> },
  { key: "AUS", image: <AU /> },
  { key: "FRA", image: <FR /> },
  { key: "FIN", image: <FI /> },
  { key: "JPN", image: <JP /> },
  { key: "CHI", image: <CN /> },
  { key: "ENG", image: <GB /> },
  { key: "NOR", image: <NO /> },
  { key: "ARG", image: <AR /> },
  { key: "VEN", image: <VE /> },
  { key: "DEN", image: <DK /> },
  { key: "TPE", image: <TW /> },
  { key: "CAN", image: <CA /> },
  { key: "ITA", image: <IT /> },
  { key: "GER", image: <DE /> },
  { key: "IRL", image: <IE /> },
  { key: "BEL", image: <BE /> },
  { key: "COL", image: <CO /> },
  { key: "PUR", image: <PR /> },
  { key: "PHI", image: <PH /> },
  { key: "NIR", image: <GB /> },
  { key: "AUT", image: <AT /> },
  { key: "SCO", image: <GB /> },
];
const countryFlag = (code: string | null) =>
  countryFlags.find((obj) => obj.key === code)?.image;

const getSortedTeamGolfers = (
  team: LeaderboardTeam,
  teamGolfers: LeaderboardGolfer[] = [],
) =>
  sortMultiple(filterItems(teamGolfers, { apiId: team.golferIds }), [
    { field: "today", direction: "asc", type: "number" },
    { field: "thru", direction: "asc", type: "number" },
    { field: "score", direction: "asc", type: "number" },
    { field: "group", direction: "asc", type: "number" },
  ]);

const getGolferRowClass = (
  team: LeaderboardTeam,
  golfer: LeaderboardGolfer,
  i: number,
) =>
  cn(
    (team.round ?? 0) >= 3 && i === 4 && "border-b border-gray-700",
    i === 9 && "border-b border-gray-700",
    ["CUT", "WD", "DQ"].includes(golfer.position ?? "") && "text-gray-400",
  );

const sortTeamsForSpecialPositions = (teams: LeaderboardTeam[]) =>
  teams
    ?.sort((a, b) => (a.thru ?? 0) - (b.thru ?? 0))
    .sort(
      (a, b) =>
        (a.position === "DQ"
          ? 999 + (a.score ?? 999)
          : a.position === "WD"
            ? 888 + (a.score ?? 999)
            : a.position === "CUT"
              ? 444 + (a.score ?? 999)
              : (a.score ?? 999)) -
        (b.position === "DQ"
          ? 999 + (b.score ?? 999)
          : b.position === "WD"
            ? 888 + (b.score ?? 999)
            : b.position === "CUT"
              ? 444 + (b.score ?? 999)
              : (b.score ?? 999)),
    );

const sortGolfersForSpecialPositions = (golfers: LeaderboardGolfer[]) =>
  golfers.sort(
    (a, b) =>
      (a.position === "DQ"
        ? 999 + (a.score ?? 999)
        : a.position === "WD"
          ? 888 + (a.score ?? 999)
          : a.position === "CUT"
            ? 444 + (a.score ?? 999)
            : (a.score ?? 999)) -
      (b.position === "DQ"
        ? 999 + (b.score ?? 999)
        : b.position === "WD"
          ? 888 + (b.score ?? 999)
          : b.position === "CUT"
            ? 444 + (b.score ?? 999)
            : (b.score ?? 999)),
  );

const PositionChange = ({ posChange }: { posChange: number }) =>
  posChange === 0 ? (
    <span className="ml-1 flex items-center justify-center text-3xs">
      <MoveHorizontalIcon className="w-2" />
    </span>
  ) : (
    <span
      className={cn(
        "ml-0.5 flex items-center justify-center text-2xs",
        posChange > 0 ? "text-green-900" : "text-red-900",
      )}
    >
      {posChange > 0 ? (
        <MoveUpIcon className="w-2" />
      ) : (
        <MoveDownIcon className="w-2" />
      )}
      {Math.abs(posChange)}
    </span>
  );

const PGADropdown = ({
  golfer,
  userTeam,
}: {
  golfer: LeaderboardGolfer;
  userTeam?: LeaderboardTeam;
}) => (
  <div
    className={cn(
      "col-span-10 mb-2 rounded-lg border-b border-l border-r border-slate-300 p-2 pt-1 shadow-lg",
      userTeam?.golferIds.includes(golfer.apiId) && "bg-slate-100",
      golfer.position &&
        ["WD", "DQ", "CUT"].includes(golfer.position) &&
        "text-gray-400",
    )}
  >
    <div className="mx-auto grid max-w-2xl grid-cols-12 sm:grid-cols-16">
      <div className="col-span-2 row-span-2 flex items-center justify-center text-sm font-bold">
        <div
          className={cn(
            "w-[55%] max-w-8",
            golfer.position &&
              ["WD", "DQ", "CUT"].includes(golfer.position) &&
              "opacity-40",
          )}
        >
          {countryFlag(golfer.country)}
        </div>
      </div>
      <div className="col-span-6 text-sm font-bold sm:hidden">Rounds</div>
      <div className="col-span-2 text-sm font-bold sm:hidden">Usage</div>
      <div className="col-span-2 text-sm font-bold sm:hidden">Group</div>
      <div className="col-span-6 text-lg sm:hidden">
        {[golfer.roundOne, golfer.roundTwo, golfer.roundThree, golfer.roundFour]
          .filter(Boolean)
          .join(" / ")}
      </div>
      <div className="col-span-2 text-lg sm:hidden">
        {Math.round((golfer.usage ?? 0) * 1000) / 10}%
      </div>
      <div className="col-span-2 text-lg sm:hidden">
        {golfer.group === 0 ? "-" : golfer.group}
      </div>
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
    </div>
  </div>
);

const TeamGolfersTable = ({
  team,
  teamGolfers,
  course,
}: {
  team: LeaderboardTeam;
  teamGolfers: LeaderboardGolfer[] | undefined;
  course?: LeaderboardCourse | null;
}) => {
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
          {golfer.thru === 0 && course ? (
            <td className="text-xs" colSpan={2}>
              {getGolferTeeTime(golfer)}
            </td>
          ) : (
            <>
              <td className="text-xs">{formatScore(golfer.today)}</td>
              <td className="text-xs">
                {golfer.thru === 18 ? "F" : golfer.thru}
              </td>
            </>
          )}
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

const LeaderboardListing = ({
  type,
  tournament,
  tournamentGolfers,
  userTourCard,
  golfer,
  team,
  tourCard,
  course,
  teamGolfers,
  member,
}: LeaderboardListingProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const posChange =
    type === "PGA"
      ? (golfer?.posChange ?? 0)
      : team?.pastPosition && team?.position
        ? +team.pastPosition.replace("T", "") - +team.position.replace("T", "")
        : 0;
  if (!team && !golfer) return null;
  const rowClass = cn(
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
    type === "PGA" &&
      ["WD", "DQ", "CUT"].includes(golfer?.position ?? "") &&
      "text-gray-400",
  );
  return (
    <div
      key={team?.id ?? golfer?.apiId}
      onClick={() => setIsOpen((open) => !open)}
      className={cn(
        "mx-auto my-0.5 grid max-w-4xl grid-flow-row grid-cols-10 rounded-md text-center",
      )}
    >
      <div className={rowClass}>
        <div className="col-span-2 flex place-self-center font-varela text-base sm:col-span-3">
          {type === "PGA" ? golfer?.position : team?.position}
          {(tournament?.currentRound ?? 0) > 1 &&
            team?.position !== "CUT" &&
            golfer?.position !== "CUT" &&
            golfer?.position !== "WD" &&
            golfer?.position !== "DQ" && (
              <PositionChange posChange={posChange} />
            )}
        </div>
        <div className="col-span-4 place-self-center font-varela text-lg">
          {type === "PGA" ? golfer?.playerName : tourCard?.displayName}
        </div>
        <div className="col-span-2 place-self-center font-varela text-base">
          {type !== "PGA" && team?.position === "CUT"
            ? "-"
            : formatScore((type === "PGA" ? golfer?.score : team?.score) ?? 0)}
        </div>
        {team?.position === "CUT" ||
        golfer?.position === "CUT" ||
        golfer?.position === "WD" ||
        golfer?.position === "DQ" ? (
          <div className="col-span-2 sm:col-span-3"></div>
        ) : team?.round === 5 || golfer?.round === 5 ? (
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
        ) : type === "PGA" ? (
          !golfer?.thru || golfer?.thru === 0 ? (
            <div className="col-span-2 place-self-center font-varela text-xs">
              {course && golfer ? getGolferTeeTime(golfer) : null}
              {golfer?.endHole === 9 ? "*" : ""}
            </div>
          ) : (
            <>
              <div className="col-span-1 place-self-center font-varela text-sm">
                {golfer?.today !== null ? formatScore(golfer?.today) : "-"}
              </div>
              <div className="col-span-1 place-self-center font-varela text-sm">
                {golfer?.thru === 18 ? "F" : golfer?.thru}
              </div>
            </>
          )
        ) : (
          <div className="col-span-2 place-self-center font-varela text-xs">
            {team?.round === 5
              ? "-"
              : team?.round === 4
                ? "F"
                : team?.thru === 18
                  ? "F"
                  : team?.thru}
          </div>
        )}
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

function LeaderboardHeaderRow({
  tournamentOver,
  activeTour,
}: {
  tournamentOver: boolean;
  activeTour: string;
}) {
  return (
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
        {tournamentOver
          ? activeTour === "PGA"
            ? "Rating"
            : "Earnings"
          : "Thru"}
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
}
