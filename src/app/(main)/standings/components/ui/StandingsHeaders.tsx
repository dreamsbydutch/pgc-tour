"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/app/_components/ui/popover";
import { PointsAndPayoutsPopover } from "./PointsAndPayoutsPopover";
import type { StandingsHeaderProps } from "../../types";

/**
 * StandingsHeader Component
 *
 * Renders the header row for the standings table.
 */
export function StandingsHeader() {
  return (
    <div className="grid grid-flow-row grid-cols-17 text-center">
      <div className="col-span-16 grid grid-flow-row grid-cols-10 text-center">
        <div className="place-self-center font-varela text-xs font-bold sm:text-sm">
          Rank
        </div>
        <div className="col-span-5 place-self-center font-varela text-base font-bold sm:text-lg">
          Name
        </div>
        <div className="col-span-2 place-self-center font-varela text-xs font-bold xs:text-sm sm:text-base">
          Cup Points
        </div>
        <div className="col-span-2 place-self-center font-varela text-2xs xs:text-xs sm:text-sm">
          Earnings
        </div>
      </div>
    </div>
  );
}

export function GoldPlayoffHeader({ tier }: StandingsHeaderProps) {
  return (
    <Popover>
      <PopoverTrigger className="col-span-7 row-span-1 w-full text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
        <div className="grid grid-flow-row grid-cols-17 rounded-xl bg-gradient-to-b from-champ-400 text-center">
          <div className="col-span-17 my-2 font-varela text-2xl font-extrabold text-champ-900">
            PGC GOLD PLAYOFF
          </div>
          <div className="col-span-16 grid grid-flow-row grid-cols-10 text-center">
            <div className="place-self-center font-varela text-xs font-bold sm:text-sm">
              Rank
            </div>
            <div className="col-span-5 place-self-center font-varela text-base font-bold sm:text-lg">
              Name
            </div>
            <div className="col-span-2 place-self-center font-varela text-xs font-bold xs:text-sm sm:text-base">
              Cup Points
            </div>
            <div className="col-span-2 place-self-center font-varela text-2xs xs:text-xs sm:text-sm">
              Starting Strokes
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-fit">
        <PointsAndPayoutsPopover {...{ tier }} />
      </PopoverContent>
    </Popover>
  );
}

export function SilverPlayoffHeader({ tier }: StandingsHeaderProps) {
  return (
    <Popover>
      <PopoverTrigger className="col-span-7 row-span-1 w-full text-center font-varela text-2xs xs:text-xs sm:text-sm md:text-base lg:text-lg">
        <div className="mt-12 grid grid-flow-row grid-cols-17 rounded-xl bg-gradient-to-b from-zinc-300 text-center">
          <div className="col-span-17 my-2 font-varela text-2xl font-extrabold text-zinc-600">
            PGC SILVER PLAYOFF
          </div>
          <div className="col-span-16 grid grid-flow-row grid-cols-10 text-center">
            <div className="place-self-center font-varela text-xs font-bold sm:text-sm">
              Rank
            </div>
            <div className="col-span-5 place-self-center font-varela text-base font-bold sm:text-lg">
              Name
            </div>
            <div className="col-span-2 place-self-center font-varela text-xs font-bold xs:text-sm sm:text-base">
              Cup Points
            </div>
            <div className="col-span-2 place-self-center font-varela text-2xs xs:text-xs sm:text-sm">
              Starting Strokes
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-fit">
        <PointsAndPayoutsPopover {...{ tier }} />
      </PopoverContent>
    </Popover>
  );
}
