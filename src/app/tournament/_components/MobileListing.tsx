"use client";

import {
  cn,
  formatScore,
  getGolferTeeTime,
  getTeamTeeTime,
} from "@/src/lib/utils";
import type { Course, Golfer, Member } from "@prisma/client";
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
import {
  TeamData,
  TourCardData,
  TournamentData,
} from "@/src/types/prisma_include";
import { MoveDownIcon, MoveHorizontalIcon, MoveUpIcon } from "lucide-react";
import { api } from "@/src/trpc/react";
import { Table, TableRow } from "../../_components/ui/table";

export function MobileListing({
  type,
  tournament,
  golfer,
  userTeam,
  tourCard,
}: {
  type: "PGC" | "PGA";
  tournament: TournamentData;
  golfer?: Golfer;
  userTeam?: TeamData;
  tourCard?: TourCardData;
}) {
  const member = api.member.getSelf.useQuery().data;
  const course = api.course.getById.useQuery({
    courseID: userTeam?.tournament.courseId ?? "",
  }).data;

  const [isOpen, setIsOpen] = useState(false);
  const team = type === "PGA" ? golfer : userTeam;

  const total =
    type === "PGA"
      ? (golfer?.roundOne ?? 0) +
        (golfer?.roundTwo ?? 0) +
        (golfer?.roundThree ?? 0) +
        (golfer?.roundFour ?? 0)
      : (userTeam?.roundOne ?? 0) +
        (userTeam?.roundTwo ?? 0) +
        (userTeam?.roundThree ?? 0) +
        (userTeam?.roundFour ?? 0);
  const posChange =
    (type === "PGA"
      ? golfer?.posChange
      : (userTeam?.pastPosition ? +userTeam.pastPosition.replace("T", "") : 0) -
        (userTeam?.position ? +userTeam.position.replace("T", "") : 0)) ?? 0;
  if (!team) return <></>;

  return (
    <div
      key={team.id}
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "my-0.5 grid max-w-4xl grid-flow-row grid-cols-10 rounded-md text-center",
      )}
    >
      <div
        className={cn(
          "col-span-10 grid grid-flow-row grid-cols-10 py-0.5",
          type === "PGC" &&
            userTeam?.tourCardId === tourCard?.id &&
            "bg-slate-200 font-semibold",
          type === "PGC" &&
            tourCard?.member.friends.includes(
              userTeam?.tourCard.memberId ?? "",
            ) &&
            "bg-slate-100",
          type === "PGC" &&
            member?.friends.includes(userTeam?.tourCard.memberId ?? "") &&
            "bg-slate-100",
          type === "PGA" &&
            userTeam?.golferIds.includes(golfer?.apiId ?? 0) &&
            "bg-slate-100",
          type === "PGA" &&
            (golfer?.position === "WD" ||
              golfer?.position === "DQ" ||
              golfer?.position === "CUT")
            ? "text-gray-400"
            : "",
          // !(countryFlags.find((obj) => obj.key === golfer?.country)) && "text-red-900",
        )}
      >
        <div className="col-span-2 flex place-self-center font-varela text-base">
          {team.position}
          {(tournament?.currentRound ?? 0) <= 1 ? (
            <></>
          ) : !posChange || posChange === 0 ? (
            <span className="ml-1 flex items-center justify-center text-3xs">
              <MoveHorizontalIcon className="w-2" />
            </span>
          ) : posChange > 0 ? (
            <span className="ml-0.5 flex items-center justify-center text-3xs text-green-900">
              <MoveUpIcon className="w-2" />
              {Math.abs(posChange)}
            </span>
          ) : (
            <span className="ml-0.5 flex items-center justify-center text-3xs text-red-900">
              <MoveDownIcon className="w-2" />
              {Math.abs(posChange)}
            </span>
          )}
        </div>
        <div className="col-span-4 place-self-center font-varela text-lg">
          {type === "PGA" ? golfer?.playerName : userTeam?.tourCard.displayName}
        </div>
        <div className="col-span-2 place-self-center font-varela text-base">
          {formatScore(team.score)}
        </div>
        {team.position === "CUT" ||
        team.position === "WD" ||
        team.position === "DQ" ? (
          <div className="col-span-2"></div>
        ) : !team.thru || team.thru === 0 ? (
          <div className="col-span-2 place-self-center font-varela text-xs">
            {course &&
              golfer &&
              userTeam &&
              (type === "PGA"
                ? getGolferTeeTime(course, golfer)
                : getTeamTeeTime(course, userTeam))}
            {type === "PGA" && golfer?.endHole === 9 ? "*" : ""}
          </div>
        ) : (
          <>
            <div className="col-span-1 place-self-center font-varela text-sm">
              {formatScore(team.today)}
            </div>
            <div className="col-span-1 place-self-center whitespace-nowrap font-varela text-sm">
              {team.thru === 18 ? "F" : team.thru}
              {type === "PGA" && golfer?.endHole === 9 ? "*" : ""}
            </div>
          </>
        )}
      </div>
      {isOpen && golfer && type == "PGA" && (
        <PGAMobileDropdown {...{ golfer, userTeam, total }} />
      )}
      {isOpen && userTeam && course && type == "PGC" && (
        <PGCMobileDropdown
          {...{
            tournament,
            course,
            team: userTeam,
            tourCard,
            member: member ?? undefined,
          }}
        />
      )}
    </div>
  );
}

function PGAMobileDropdown({
  golfer,
  userTeam,
  total,
}: {
  golfer: Golfer;
  userTeam?: TeamData;
  total: number;
}) {
  return (
    <div
      className={cn(
        "col-span-10 mb-2 grid grid-cols-12 pt-1",
        userTeam?.golferIds.includes(golfer.apiId) && "bg-slate-100",
        golfer.position === "WD" ||
          golfer.position === "DQ" ||
          golfer.position === "CUT"
          ? "text-gray-400"
          : "",
        "rounded-lg border-b border-l border-r border-slate-300 p-2 shadow-lg",
      )}
    >
      <div className="col-span-3 row-span-2 flex items-center justify-center text-sm font-bold">
        <div
          className={cn(
            "w-6",
            golfer.position === "WD" ||
              golfer.position === "DQ" ||
              golfer.position === "CUT"
              ? "opacity-40"
              : "",
          )}
        >
          {countryFlag(golfer.country)}
        </div>
      </div>
      <div className="col-span-3 text-sm font-bold">Make Cut</div>
      <div className="col-span-2 text-sm font-bold">Top Ten</div>
      <div className="col-span-2 text-sm font-bold">Win</div>
      <div className="col-span-2 text-sm font-bold">Usage</div>
      <div className="col-span-3 text-lg">
        {Math.round((golfer.makeCut ?? 0) * 1000) / 10}%
      </div>
      <div className="col-span-2 text-lg">
        {Math.round((golfer.topTen ?? 0) * 1000) / 10}%
      </div>
      <div className="col-span-2 text-lg">
        {Math.round((golfer.win ?? 0) * 1000) / 10}%
      </div>
      <div className="col-span-2 text-lg">
        {Math.round((golfer.usage ?? 0) * 1000) / 10}%
      </div>
      <div className="col-span-8 text-sm font-bold">Rounds</div>
      <div className="col-span-2 text-sm font-bold">Tot</div>
      <div className="col-span-2 text-sm font-bold">Group</div>
      <div className="col-span-8 text-lg">{`${golfer.roundOne ? golfer.roundOne : ""}${golfer.roundTwo ? " / " + golfer.roundTwo : ""}${golfer.roundThree ? " / " + golfer.roundThree : ""}${golfer.roundFour ? " / " + golfer.roundFour : ""}`}</div>
      <div className="col-span-2 text-lg">{total}</div>
      <div className="col-span-2 text-lg">{golfer.group}</div>
    </div>
  );
}

function PGCMobileDropdown({
  tournament,
  course,
  team,
  tourCard,
  member,
}: {
  tournament: TournamentData;
  course: Course;
  team: TeamData;
  tourCard?: TourCardData;
  member?: Member;
}) {
  const golfers = api.golfer.getByTournament.useQuery({
    tournamentId: tournament.id,
  }).data;
  const moneyThreshold =
    tournament.tier.payouts.filter((a) => a > 0).length === 3
      ? "Three"
      : "Five";
  return (
    <div
      className={cn(
        "col-span-10",
        team.tourCardId === tourCard?.id &&
          "bg-gradient-to-b from-slate-200 via-slate-100 to-slate-100",
        tourCard?.member.friends.includes(team.tourCard.memberId) &&
          "bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50",
        member?.friends.includes(team.tourCard.memberId) &&
          "bg-gradient-to-b from-slate-100 via-slate-50 to-slate-50",
        "border-b border-slate-300 p-2",
      )}
    >
      <div
        className={cn(
          "col-span-10 grid grid-cols-12 items-center justify-center",
        )}
      >
        <div className="col-span-7 text-sm font-bold">Rounds</div>
        {(tournament.currentRound ?? 0) <= 2 ? (
          <>
            <div className="col-span-3 text-sm font-bold">Make Cut</div>
            <div className="col-span-2 text-sm font-bold">
              Top {moneyThreshold}
            </div>
          </>
        ) : (
          <>
            <div className="col-span-3 text-sm font-bold">
              Top {moneyThreshold}
            </div>
            <div className="col-span-2 text-sm font-bold">Win</div>
          </>
        )}
        <div className="col-span-7 text-lg">
          {team.roundOne ?? "-"}
          {team.roundTwo ? " / " + team.roundTwo : ""}
          {team.roundThree ? " / " + team.roundThree : ""}
          {team.roundFour ? " / " + team.roundFour : ""}
        </div>
        {(tournament.currentRound ?? 0) <= 2 ? (
          <>
            <div className="col-span-3 text-lg">
              {Math.round((team.makeCut ?? 0) * 1000) / 10}%
            </div>
            <div className="col-span-2 text-lg">
              {Math.round(
                (Number(team[("top" + moneyThreshold) as keyof TeamData]) ??
                  0) * 1000,
              ) / 10}
              %
            </div>
          </>
        ) : (
          <>
            <div className="col-span-3 text-lg">
              {Math.round(
                (Number(team[("top" + moneyThreshold) as keyof TeamData]) ??
                  0) * 1000,
              ) / 10}
              %
            </div>
            <div className="col-span-2 text-lg">
              {Math.round((team.win ?? 0) * 1000) / 10}%
            </div>
          </>
        )}
      </div>
      <div className="col-span-10 my-4 w-full">
        <Table className="scrollbar-hidden mx-auto w-full border border-gray-700 text-center font-varela">
          <TableRow className="bg-gray-700 font-bold text-gray-100 hover:bg-gray-700">
            <td className="px-0.5 text-xs">Pos</td>
            <td className="px-0.5 text-xs">Player</td>
            <td className="px-0.5 text-xs">Score</td>
            <td className="px-0.5 text-2xs">Today</td>
            <td className="px-0.5 text-2xs">Thru</td>
            <td className="px-0.5 text-2xs">Group</td>
          </TableRow>
          {golfers
            ?.filter((g) => team.golferIds.includes(g.apiId))
            .sort(
              (a, b) =>
                (a.today ?? 999) - (b.today ?? 999) || // Sort by today
                (a.thru ?? 0) - (b.thru ?? 0) || // Then sort by thru
                (a.score ?? 999) - (b.score ?? 999) || // Then sort by score
                (a.group ?? 999) - (b.group ?? 999),
            )
            .map((golfer, i) => (
              <TableRow
                key={golfer.id}
                className={cn(
                  (team.round ?? 0) >= 3 && i === 4
                    ? "border-b border-gray-700"
                    : "",
                  i === 9 && "border-b border-gray-700",
                  (golfer.position === "CUT" ||
                    golfer.position === "WD" ||
                    golfer.position === "DQ") &&
                    "text-gray-400",
                )}
              >
                <td className="px-1 text-xs">{golfer.position}</td>
                <td className="whitespace-nowrap px-1 text-sm">
                  {golfer.playerName}
                </td>
                <td className="border-r border-gray-300 px-1 text-sm">
                  {formatScore(golfer.score)}
                </td>
                {golfer.thru === 0 ? (
                  <td className="text-xs" colSpan={2}>
                    {course && getGolferTeeTime(course, golfer)}
                  </td>
                ) : (
                  <>
                    <td className="text-xs">{formatScore(golfer.today)}</td>
                    <td className="text-xs">
                      {golfer.thru === 18 ? "F" : golfer.thru}
                    </td>
                  </>
                )}
                <td className="border-l border-gray-300 text-xs">
                  {golfer.group}
                </td>
              </TableRow>
            ))}
        </Table>
      </div>
    </div>
  );
}

// COUNTRY FLAG UTILITY FUNCTION

function countryFlag(countryCode: string | null) {
  const country = countryFlags.find((obj) => obj.key === countryCode);
  return country?.image;
}

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
  { key: "NIR", image: <GB /> }, // Northern Ireland uses the same flag as Great Britain
  { key: "AUT", image: <AT /> }, // Austria
  { key: "SCO", image: <GB /> },
];
