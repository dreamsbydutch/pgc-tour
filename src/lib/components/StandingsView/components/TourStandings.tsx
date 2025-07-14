import type { TourCard, Tour } from "@prisma/client";
import {
  getGoldCutCards,
  getSilverCutCards,
  getRemainingCards,
} from "../utils/standingsHelpers";
import { StandingsTableHeader } from "./StandingsTableHeader";
import { StandingsListing } from "./StandingsListing";

export interface TourStandingsProps {
  activeTour: Tour | undefined;
  tourCards?: TourCard[];
}

export function TourStandings({ activeTour, tourCards }: TourStandingsProps) {
  if (!activeTour || !tourCards) return null;

  const tourData = { ...activeTour, tourCards };
  const goldCutCards = getGoldCutCards(tourData);
  const silverCutCards = getSilverCutCards(tourData);
  const remainingCards = getRemainingCards(tourData);

  return (
    <div className="mx-auto px-1">
      <StandingsTableHeader variant="regular" />

      {/* Gold Playoff Qualifiers */}
      {goldCutCards.map((tourCard: TourCard & { points?: number }) => (
        <StandingsListing
          key={tourCard.id}
          variant="regular"
          tourCard={tourCard}
        />
      ))}

      <div className="h-3 rounded-lg bg-champ-900 text-center text-2xs font-bold text-white">
        GOLD PLAYOFF CUT LINE
      </div>

      {/* Silver Playoff Qualifiers */}
      {silverCutCards.map((tourCard: TourCard & { points?: number }) => (
        <StandingsListing
          key={tourCard.id}
          variant="regular"
          tourCard={tourCard}
        />
      ))}

      <div className="h-3 rounded-lg bg-gray-400 text-center text-2xs font-bold text-white">
        SILVER PLAYOFF CUT LINE
      </div>

      {/* Remaining Players */}
      {remainingCards.map((tourCard: TourCard & { points?: number }) => (
        <StandingsListing
          key={tourCard.id}
          variant="regular"
          tourCard={tourCard}
        />
      ))}
    </div>
  );
}
