"use client";

import { cn, formatScore, getGolferTeeTime } from "@/src/lib/utils";
import type { Golfer } from "@prisma/client";
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
import { TeamData } from "@/src/types/prisma_include";
import { MoveDownIcon, MoveUpIcon } from "lucide-react";
import { api } from "@/src/trpc/react";

export function PGAListing({
  golfer,
  userTeam,
}: {
  golfer: Golfer;
  userTeam: TeamData | undefined;
}) {
  const course = api.course.getById.useQuery({
    courseID: userTeam?.tournament.courseId ?? "",
  });
  const [isOpen, setIsOpen] = useState(false);
  const total =
    (golfer.roundOne ?? 0) +
    (golfer.roundTwo ?? 0) +
    (golfer.roundThree ?? 0) +
    (golfer.roundFour ?? 0);
  return (
    <div
      key={golfer.id}
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "my-1 grid grid-flow-row grid-cols-10 rounded-md text-center",
      )}
    >
      <div
        className={cn(
          "col-span-10 grid grid-flow-row grid-cols-10 py-0.5",
          userTeam?.golferIds.includes(golfer.apiId) && "bg-slate-100",
          golfer.position === "WD" ||
            golfer.position === "DQ" ||
            golfer.position === "CUT"
            ? "text-gray-400"
            : "",
        )}
      >
        <div className="col-span-2 flex place-self-center font-varela text-base">
          {golfer.position}
          {!golfer.posChange ? (
            <></>
          ) : golfer.posChange > 0 ? (
            <span className="ml-0.5 flex items-center justify-center text-xs text-green-900">
              <MoveUpIcon className="w-3" />
              {Math.abs(golfer.posChange)}
            </span>
          ) : (
            <span className="ml-0.5 flex items-center justify-center text-2xs text-red-900">
              <MoveDownIcon className="w-3" />
              {Math.abs(golfer.posChange)}
            </span>
          )}
        </div>
        <div className="col-span-4 place-self-center font-varela text-lg">
          {golfer.playerName}
          {/* <div className="w-4">
          {countryFlags.find((obj) => obj.key === golfer.country)
            ? null
            : golfer.country}
        </div> */}
        </div>
        <div className="col-span-2 place-self-center font-varela text-base">
          {formatScore(golfer.score)}
        </div>
        {!golfer.thru || golfer.thru === 0 ? (
          <div className="col-span-2 place-self-center font-varela text-xs">
            {course.data && getGolferTeeTime(course.data, golfer)}
            {golfer.endHole === 9 ? "*" : ""}
          </div>
        ) : (
          <>
            <div className="col-span-1 place-self-center font-varela text-sm">
              {formatScore(golfer.today)}
            </div>
            <div className="col-span-1 place-self-center whitespace-nowrap font-varela text-sm">
              {golfer.thru === 18 ? "F" : golfer.thru}
              {golfer.endHole === 9 ? "*" : ""}
            </div>
          </>
        )}
      </div>
      {isOpen && (
        <div
          className={cn(
            "col-span-10 mb-2 grid grid-cols-12 pt-1",
            userTeam?.golferIds.includes(golfer.apiId) && "bg-slate-100",
            isOpen &&
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
      )}
    </div>
  );
}

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
