"use client";

import { useMainStore } from "@/src/lib/store/store";
import { useState } from "react";
import { ToursToggleButton } from "../../components/ui/ToursToggleButton";
import {
  StandingsHeader,
  GoldPlayoffHeader,
  SilverPlayoffHeader,
} from "../../components/ui/StandingsHeaders";
import {
  StandingsListing,
  PlayoffStandingsListing,
} from "../../components/listings/StandingsListings";
import type {
  StandingsMainViewProps,
  TourStandingsProps,
  PlayoffStandingsProps,
} from "../../types";
import {
  filterTourCardsByTour,
  sortTourCardsByPoints,
  filterByPlayoffRange,
  getGoldPlayoffTeams,
  getSilverPlayoffTeams,
  createPlayoffsTour,
  createMockTier,
  getInitialStandingsToggle,
} from "../../utils";

/**
 * Main Standings Page Component
 *
 * Handles the main standings display logic including tour selection and
 * switching between regular tour standings and playoff standings.
 */
export default function StandingsMainView({
  searchParams,
}: StandingsMainViewProps) {
  const tours = useMainStore((state) => state.tours);
  const tourCard = useMainStore((state) => state.currentTourCard);

  const [standingsToggle, setStandingsToggle] = useState<string>(
    getInitialStandingsToggle(searchParams, tourCard, tours),
  );

  const activeTour =
    tours?.find((tour) => tour.id === standingsToggle) ?? tours?.[0];
  const playoffsTour = createPlayoffsTour(tourCard?.seasonId ?? "");

  return (
    <>
      <div className="my-2 pb-2 text-center font-yellowtail text-5xl sm:text-6xl md:text-7xl">
        {standingsToggle === "playoffs" ? "PGC Playoff" : activeTour?.name}{" "}
        Standings
      </div>
      <div className="font-italic text-center font-varela text-xs sm:text-sm md:text-base">
        Click on a tour member to view thier stats and tournament history
      </div>
      {(tours?.length ?? 0) > 1 && (
        <div className="mx-auto my-4 flex w-full flex-row items-center justify-center gap-4 text-center">
          {tours
            ?.sort((a, b) => a.shortForm.localeCompare(b.shortForm))
            .map((tour) => (
              <ToursToggleButton
                key={"toggle-" + tour.id}
                tour={tour}
                tourToggle={standingsToggle}
                setTourToggle={setStandingsToggle}
              />
            ))}
          <ToursToggleButton
            key={"toggle-playoffs"}
            tour={playoffsTour}
            tourToggle={standingsToggle}
            setTourToggle={setStandingsToggle}
          />
        </div>
      )}
      {standingsToggle === "playoffs" ? (
        <PlayoffStandings tours={tours} />
      ) : (
        <TourStandings activeTour={activeTour} />
      )}
    </>
  );
}

/**
 * TourStandings Component
 *
 * Displays the regular season standings for a specific tour,
 * including playoff cutlines.
 */
function TourStandings({ activeTour }: TourStandingsProps) {
  const tourCards = useMainStore((state) => state.tourCards);

  if (!activeTour) {
    return (
      <div className="mx-auto px-1 text-center">
        <p className="text-gray-500">No tour selected</p>
      </div>
    );
  }

  const filteredTourCards = filterTourCardsByTour(tourCards, activeTour.id);
  const sortedTourCards = sortTourCardsByPoints(filteredTourCards);

  const goldQualifiers = filterByPlayoffRange(
    sortedTourCards,
    1,
    activeTour.playoffSpots[0] ?? 0,
  );
  const silverQualifiers = filterByPlayoffRange(
    sortedTourCards,
    (activeTour.playoffSpots[0] ?? 0) + 1,
    (activeTour.playoffSpots[0] ?? 0) + (activeTour.playoffSpots[1] ?? 0),
  );
  const nonQualifiers = sortedTourCards.filter(
    (obj) =>
      +(obj.position?.replace("T", "") ?? 0) >
      (activeTour.playoffSpots[0] ?? 0) + (activeTour.playoffSpots[1] ?? 0),
  );

  return (
    <div className="mx-auto px-1">
      <StandingsHeader />

      {/* Gold Playoff Qualifiers */}
      {goldQualifiers.map((tourCard) => (
        <StandingsListing key={tourCard.id} tourCard={tourCard} />
      ))}

      <div className="h-3 rounded-lg bg-champ-900 text-center text-2xs font-bold text-white">
        GOLD PLAYOFF CUT LINE
      </div>

      {/* Silver Playoff Qualifiers */}
      {silverQualifiers.map((tourCard) => (
        <StandingsListing key={tourCard.id} tourCard={tourCard} />
      ))}

      <div className="h-3 rounded-lg bg-gray-400 text-center text-2xs font-bold text-white">
        SILVER PLAYOFF CUT LINE
      </div>

      {/* Non-Qualifiers */}
      {nonQualifiers.map((tourCard) => (
        <StandingsListing key={tourCard.id} tourCard={tourCard} />
      ))}
    </div>
  );
}

/**
 * PlayoffStandings Component
 *
 * Displays the playoff standings with gold and silver playoff sections.
 */
function PlayoffStandings({ tours }: PlayoffStandingsProps) {
  const tourCards = useMainStore((state) => state.tourCards);
  const tiers = useMainStore((state) => state.currentTiers);

  const goldTeams = getGoldPlayoffTeams(tours, tourCards);
  const silverTeams = getSilverPlayoffTeams(tours, tourCards);
  const playoffTier = tiers?.find((t) => t.name === "Playoff");

  const goldTier = createMockTier(
    "gold",
    "Gold",
    playoffTier?.payouts.slice(0, 30) ?? [],
    playoffTier?.points.slice(0, 30) ?? [],
  );

  const silverTier = createMockTier(
    "silver",
    "Silver",
    playoffTier?.payouts.slice(75, 85) ?? [],
    playoffTier?.points.slice(75, 85) ?? [],
  );

  return (
    <div className="mx-auto px-1">
      {/* Gold Playoff Section */}
      <GoldPlayoffHeader tier={goldTier} />
      {sortTourCardsByPoints(goldTeams).map((tourCard) => (
        <PlayoffStandingsListing
          key={tourCard.id}
          tourCard={tourCard}
          teams={goldTeams}
          strokes={playoffTier?.points.slice(0, 30) ?? []}
        />
      ))}

      {/* Silver Playoff Section */}
      <SilverPlayoffHeader tier={silverTier} />
      {sortTourCardsByPoints(silverTeams).map((tourCard) => (
        <PlayoffStandingsListing
          key={tourCard.id}
          tourCard={tourCard}
          teams={silverTeams}
          strokes={playoffTier?.points.slice(0, 40) ?? []}
        />
      ))}
    </div>
  );
}
