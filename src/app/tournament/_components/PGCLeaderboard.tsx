"use client";

import { cn, formatScore } from "@/src/lib/utils";
import { TeamData } from "@/src/types/prisma_include";
import { TourCard } from "@prisma/client";
import { useState } from "react";

export function PGCListing({
  team,
  tourCard,
}: {
  team: TeamData;
  tourCard: TourCard;
}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div
      className={cn(
        "grid grid-flow-row grid-cols-10 border-b border-slate-300 py-1 text-center",
      )}
      key={team.id}
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="col-span-2 place-self-center font-varela text-base">
        {team.position}
      </div>
      <div className="col-span-4 place-self-center font-varela text-lg">
        {team.tourCard.displayName}
      </div>
      <div className="col-span-2 place-self-center font-varela text-base">
        {formatScore(team.score)}
      </div>
      <div className="col-span-1 place-self-center font-varela text-sm">
        {formatScore(team.today)}
      </div>
      <div className="col-span-1 place-self-center whitespace-nowrap font-varela text-sm">
        {team.thru === 18 ? "F" : team.thru}
      </div>
      {isOpen && (
        <div className="col-span-10 mt-2 grid grid-cols-12">
          {/* <div className="col-span-3 row-span-2 flex items-center justify-center text-sm font-bold"></div>
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
          </div> */}
          <div className="col-span-8 text-sm font-bold">Rounds</div>
          <div className="col-span-8 text-lg">{`${team.roundOne ? team.roundOne : ""}${team.roundTwo ? " - " + team.roundTwo : ""}${team.roundThree ? " - " + team.roundThree : ""}${team.roundFour ? " - " + team.roundFour : ""}`}</div>
        </div>
      )}
    </div>
  );
}
