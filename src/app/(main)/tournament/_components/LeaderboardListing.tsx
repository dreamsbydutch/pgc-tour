"use client";

import {
  cn,
  formatMoney,
  formatScore,
  getGolferTeeTime,
  getTeamTeeTime,
} from "@/lib/utils";
import type {
  Course,
  Golfer,
  Team,
  TourCard,
  Tournament,
} from "@prisma/client";
import { useState } from "react";
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
import TeamGolfersTable from "./TeamTable";
<<<<<<< Updated upstream:src/app/(main)/tournament/_components/LeaderboardListing.tsx
import { useLeaderboardStore, useMainStore } from "@/src/lib/store/store";
=======
import { useUser, useMembers, useCourses, useTourCards } from "@/src/lib/store";
>>>>>>> Stashed changes:src/app/(main)/tournament/components/leaderboard/LeaderboardListing.tsx

/**
 * Constants for country flags
 * Maps country codes to their respective flag components.
 */
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

/**
 * Utility function to get the flag component for a given country code.
 * @param countryCode - The country code to look up.
 * @returns The corresponding flag component or undefined if not found.
 */
function countryFlag(countryCode: string | null) {
  const country = countryFlags.find((obj) => obj.key === countryCode);
  return country?.image;
}

/**
 * PositionChange Component
 *
 * Displays an icon indicating the position change of a golfer or team.
 * - Horizontal arrow for no change.
 * - Up arrow for positive change.
 * - Down arrow for negative change.
 *
 * Props:
 * - posChange: The position change value.
 */
function PositionChange({ posChange }: { posChange: number }) {
  if (posChange === 0) {
    return (
      <span className="ml-1 flex items-center justify-center text-3xs">
        <MoveHorizontalIcon className="w-2" />
      </span>
    );
  }
  return (
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
}

/**
 * PGADropdown Component
 *
 * Displays additional details for a PGA golfer when the dropdown is expanded.
 *
 * Props:
 * - golfer: The golfer object containing details.
 * - userTeam (optional): The user's team data.
 */
function PGADropdown({
  golfer,
  userTeam,
}: {
  golfer: Golfer;
  userTeam?: Team;
}) {
  return (
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
          {[
            golfer.roundOne,
            golfer.roundTwo,
            golfer.roundThree,
            golfer.roundFour,
          ]
            .filter(Boolean)
            .join(" / ")}
        </div>
        <div className="col-span-2 text-lg sm:hidden">
          {Math.round((golfer.usage ?? 0) * 1000) / 10}%
        </div>
        <div className="col-span-2 text-lg sm:hidden">
          {golfer.group === 0 ? "-" : golfer.group}
        </div>
        <div className="col-span-3 text-sm font-bold sm:col-span-2">
          Make Cut
        </div>
        <div className="col-span-3 text-sm font-bold sm:col-span-2">
          Top Ten
        </div>
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
}

/**
 * LeaderboardListing Component
 *
 * Displays a leaderboard listing for PGA or PGC tournaments.
 * - Shows golfer or team details in a responsive grid layout.
 * - Allows expanding rows to show additional details.
 *
 * Props:
 * - type: The type of leaderboard ("PGC" or "PGA").
 * - tournament: The tournament data.
 * - golfer (optional): The golfer data (for PGA).
 * - userTeam (optional): The user's team data (for PGC).
 * - tourCard (optional): The tour card data.
 */
export function LeaderboardListing({
  type,
  tournament,
  tournamentGolfers,
  userTourCard,
  golfer,
  team,
}: {
  type: "PGC" | "PGA";
  tournament: Tournament;
  tournamentGolfers: Golfer[] | null | undefined;
  userTourCard: TourCard | null | undefined;
  golfer?: Golfer;
  team?: Team
}) {
  const {tourCards} = useTourCards()
  const tourCard = tourCards?.find(
    (tc: TourCard) => tc.id === team?.tourCardId,
  );
  const { courses } = useCourses();
  const course = courses?.find((c: Course) => c.id === tournament.courseId);
  const teamGolfers =
    tournamentGolfers?.filter((a) => team?.golferIds.includes(a.apiId)) ?? [];
<<<<<<< Updated upstream:src/app/(main)/tournament/_components/LeaderboardListing.tsx
  const member = useMainStore((state) => state.currentMember);
=======
  const { user } = useUser();
  const { members } = useMembers();
  const member = members?.find((m) => m.email === user?.email);
>>>>>>> Stashed changes:src/app/(main)/tournament/components/leaderboard/LeaderboardListing.tsx
  const [isOpen, setIsOpen] = useState(false);

  const posChange =
    (type === "PGA"
      ? golfer?.posChange
      : (team?.pastPosition ? +team.pastPosition.replace("T", "") : 0) -
        (team?.position ? +team.position.replace("T", "") : 0)) ?? 0;

  if (!team && !golfer) return null;

  return (
    <div
      key={team?.id ?? golfer?.apiId}
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "mx-auto my-0.5 grid max-w-4xl grid-flow-row grid-cols-10 rounded-md text-center",
      )}
    >
      <div
        className={cn(
          "col-span-10 grid grid-flow-row grid-cols-10 py-0.5 sm:grid-cols-16",
          type === "PGC" &&
            tourCard?.id === userTourCard?.id &&
            "bg-slate-200 font-semibold",
          type === "PGC" &&
            member?.friends.includes(tourCard?.memberId ?? "") &&
            "bg-slate-100",
          type === "PGC" &&
            member?.friends.includes(tourCard?.memberId ?? "") &&
            "bg-slate-100",
          type === "PGC" && team?.position === "CUT" && "text-gray-400",
          type === "PGA" &&
            team?.golferIds.includes(golfer?.apiId ?? 0) &&
            "bg-slate-100",
          type === "PGA" &&
            ["WD", "DQ", "CUT"].includes(golfer?.position ?? "") &&
            "text-gray-400",
        )}
      >
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
              <div className="col-span-1 place-self-center whitespace-nowrap font-varela text-sm">
                {golfer?.thru === 18 ? "F" : golfer?.thru}
                {golfer?.endHole === 9 ? "*" : ""}
              </div>
            </>
          )
        ) : type === "PGC" ? (
          !team?.thru || team?.thru === 0 ? (
            <div className="col-span-2 place-self-center font-varela text-xs">
              {course && team ? getTeamTeeTime(team) : null}
            </div>
          ) : (
            <>
              <div className="col-span-1 place-self-center font-varela text-sm">
                {team?.today !== null ? formatScore(team.today) : "-"}
              </div>
              <div className="col-span-1 place-self-center whitespace-nowrap font-varela text-sm">
                {team?.thru === 18 ? "F" : team?.thru}
              </div>
            </>
          )
        ) : null}
        <div
          className={cn(
            "col-span-1 hidden place-self-center font-varela text-sm sm:flex",
          )}
        >
          {type === "PGA" ? (golfer?.roundOne ?? "-") : (team?.roundOne ?? "-")}
        </div>
        <div
          className={cn(
            "col-span-1 hidden place-self-center font-varela text-sm sm:flex",
          )}
        >
          {type === "PGA" ? (golfer?.roundTwo ?? "-") : (team?.roundTwo ?? "-")}
        </div>
        <div
          className={cn(
            "col-span-1 hidden place-self-center font-varela text-sm sm:flex",
          )}
        >
          {type === "PGA"
            ? (golfer?.roundThree ?? "-")
            : (team?.roundThree ?? "-")}
        </div>
        <div
          className={cn(
            "col-span-1 hidden place-self-center font-varela text-sm sm:flex",
          )}
        >
          {type === "PGA"
            ? (golfer?.roundFour ?? "-")
            : (team?.roundFour ?? "-")}
        </div>
      </div>
      {isOpen && golfer && type === "PGA" && (
        <PGADropdown {...{ golfer, team }} />
      )}
      {isOpen && team && type === "PGC" && (
        <div
          className={cn(
            "col-span-10 w-full border-b border-slate-300 px-2 pb-4 pt-2",
            team.tourCardId === tourCard?.id &&
              "bg-gradient-to-b from-slate-200 via-slate-100 to-slate-100",
            member?.friends.includes(tourCard?.memberId ?? "") &&
              "bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50",
            member?.friends.includes(tourCard?.memberId ?? "") &&
              "bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50",
          )}
        >
          <TeamGolfersTable {...{ team, teamGolfers, course }} />
        </div>
      )}
    </div>
  );
}
