import type { Tour } from "@prisma/client";

export interface StandingsHeaderProps {
  standingsToggle: string;
  displayedTour: Tour | undefined;
}

export function StandingsHeader({
  standingsToggle,
  displayedTour,
}: StandingsHeaderProps) {
  return (
    <>
      <div className="my-2 pb-2 text-center font-yellowtail text-5xl sm:text-6xl md:text-7xl">
        {standingsToggle === "playoffs" ? "PGC Playoff" : displayedTour?.name}{" "}
        Standings
      </div>
      <div className="font-italic text-center font-varela text-xs sm:text-sm md:text-base">
        Click on a tour member to view their stats and tournament history
      </div>
    </>
  );
}
