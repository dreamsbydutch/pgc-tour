import type { TourCard, Tour, Tier } from "@prisma/client";
import { TourStandings } from "./TourStandings";
import { PlayoffStandings } from "./PlayoffStandings";

export interface StandingsContentProps {
  standingsToggle: string;
  tours: Tour[];
  tiers: Tier[] | null;
  tourCards?: TourCard[] | null;
  displayedTour: Tour | undefined;
}

export function StandingsContent({
  standingsToggle,
  tours,
  tiers,
  tourCards,
  displayedTour,
}: StandingsContentProps) {
  if (standingsToggle === "playoffs") {
    return (
      <PlayoffStandings tours={tours} tiers={tiers} tourCards={tourCards} />
    );
  }

  return (
    <TourStandings
      activeTour={displayedTour}
      tourCards={tourCards?.filter((a) => a.tourId === displayedTour?.id)}
    />
  );
}
