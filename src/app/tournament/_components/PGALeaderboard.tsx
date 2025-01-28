"use client";

import { cn, formatScore } from "@/src/lib/utils";
import { Golfer } from "@prisma/client";
import { useState } from "react";
import {
  US,
  SE,
  ZA,
  KR,
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
  NI,
  GB,
  CA,
  TW,
} from "country-flag-icons/react/3x2";

export function PGAListing({ golfer }: { golfer: Golfer }) {
  const [isOpen, setIsOpen] = useState(false);
  const total =
    (golfer.roundOne ?? 0) +
    (golfer.roundTwo ?? 0) +
    (golfer.roundThree ?? 0) +
    (golfer.roundFour ?? 0);
  return (
    <div
      className={cn(
        "grid grid-flow-row grid-cols-10 border-b border-slate-300 py-1 text-center",
        golfer.position === "WD" ||
          golfer.position === "DQ" ||
          golfer.position === "CUT"
          ? "text-gray-400"
          : "",
      )}
      key={golfer.id}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="col-span-2 place-self-center font-varela text-base">
        {golfer.position}
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
      <div className="col-span-1 place-self-center font-varela text-sm">
        {formatScore(golfer.today)}
      </div>
      <div className="col-span-1 place-self-center whitespace-nowrap font-varela text-sm">
        {golfer.thru === 18 ? "F" : golfer.thru}
      </div>
      {isOpen && (
        <div className="col-span-10 mt-2 grid grid-cols-12">
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
          <div className="col-span-8 text-lg">{`${golfer.roundOne ? golfer.roundOne : ""}${golfer.roundTwo ? " - " + golfer.roundTwo : ""}${golfer.roundThree ? " - " + golfer.roundThree : ""}${golfer.roundFour ? " - " + golfer.roundFour : ""}`}</div>
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
  { key: "NOR", image: <NI /> },
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
];
