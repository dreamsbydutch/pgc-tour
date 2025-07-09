"use client";

import { useState } from "react";
import {
  StandingsHeader,
  StandingsListing,
} from "@/lib/components/smartComponents/functionalComponents/client/StandingsPage";
import type { Tier, Tour, TourCard } from "@prisma/client";
import { ToursToggleButton } from "@/lib/components/smartComponents/functionalComponents/client/ToursToggle";
import { useSearchParams } from "next/navigation";
import { useCurrentStandings } from "@/lib/hooks/hooks";

export default function Page() {
  const searchParams = useSearchParams();
  const { tours, tiers, tourCards, currentTourCard, isLoading, error } =
    useCurrentStandings();

  // Get default tour from search params if present
  const defaultTourId =
    searchParams.get("tour") ?? currentTourCard?.tourId ?? "";
  const [standingsToggle, setStandingsToggle] = useState<string>(defaultTourId);

  // Update activeTour when toggle changes
  const displayedTour =
    tours?.find((tour) => tour.id === standingsToggle) ?? tours?.[0];

  // TODO: Create a much better loading skeleton and error page for this standings page
  // TODO: Make this a server component to avoid loading state
  // TODO: Fix the fact that on initial load, the default tour is CCG and the toggle isnt activated
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg">Loading standings...</div>
      </div>
    );
  }

  if (error || !tours?.length) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-lg text-red-600">Error loading standings</div>
      </div>
    );
  }

  return (
    <>
      <div className="my-2 pb-2 text-center font-yellowtail text-5xl sm:text-6xl md:text-7xl">
        {standingsToggle === "playoffs" ? "PGC Playoff" : displayedTour?.name}{" "}
        Standings
      </div>
      <div className="font-italic text-center font-varela text-xs sm:text-sm md:text-base">
        Click on a tour member to view their stats and tournament history
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
            tour={{
              id: "playoffs",
              shortForm: "Playoffs",
              logoUrl:
                "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
            }}
            tourToggle={standingsToggle}
            setTourToggle={setStandingsToggle}
          />
        </div>
      )}
      {standingsToggle === "playoffs" ? (
        <PlayoffStandings tours={tours} tiers={tiers} tourCards={tourCards} />
      ) : (
        <TourStandings
          activeTour={displayedTour}
          tourCards={tourCards?.filter((a) => a.tourId === displayedTour?.id)}
        />
      )}
    </>
  );
}

// Abstracted TourStandings logic
function TourStandings({
  activeTour,
  tourCards,
}: {
  activeTour: Tour | undefined;
  tourCards?: TourCard[];
}) {
  if (!activeTour || !tourCards) return null;

  const tourData = { ...activeTour, tourCards };
  console.log("Active Tour:", activeTour);
  const goldCutCards = getGoldCutCards(tourData);
  const silverCutCards = getSilverCutCards(tourData);
  const remainingCards = getRemainingCards(tourData);

  console.log("Gold Cut Cards:", goldCutCards);
  console.log("Silver Cut Cards:", silverCutCards);
  console.log("Remaining Cards:", remainingCards);

  return (
    <div className="mx-auto px-1">
      <StandingsHeader variant="regular" />

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

// Abstracted PlayoffStandings logic
function PlayoffStandings({
  tours,
  tourCards,
  tiers,
}: {
  tours: Tour[];
  tourCards?: TourCard[] | null;
  tiers: Tier[] | null;
}) {
  const goldTeams = tourCards
    ? tourCards.filter((card) => parsePosition(card.position) <= 15)
    : [];
  const silverTeams = tourCards
    ? tourCards.filter(
        (card) =>
          parsePosition(card.position) <= 35 &&
          parsePosition(card.position) > 15,
      )
    : [];
  const playoffTier = tiers?.find((t) => t.name === "Playoff");

  return (
    <div className="mx-auto px-1">
      <StandingsHeader
        variant="gold"
        tier={{
          id: "gold",
          name: "Gold",
          payouts: playoffTier?.payouts.slice(0, 30) ?? [],
          points: playoffTier?.points.slice(0, 30) ?? [],
          seasonId: "",
          updatedAt: new Date(),
          createdAt: new Date(),
        }}
      />

      {goldTeams.map((tourCard) => (
        <StandingsListing
          variant="playoff"
          key={tourCard.id}
          tourCard={tourCard}
          teams={goldTeams}
          strokes={playoffTier?.points.slice(0, 30) ?? []}
          tour={tours.find((t) => t.id === tourCard.tourId)}
        />
      ))}

      <StandingsHeader
        variant="silver"
        tier={{
          id: "silver",
          name: "Silver",
          payouts: playoffTier?.payouts.slice(75, 115) ?? [],
          points: playoffTier?.points.slice(0, 30) ?? [],
          seasonId: "",
          updatedAt: new Date(),
          createdAt: new Date(),
        }}
      />

      {silverTeams.map((tourCard) => (
        <StandingsListing
          variant="playoff"
          key={tourCard.id}
          tourCard={tourCard}
          teams={silverTeams}
          strokes={playoffTier?.points.slice(0, 40) ?? []}
          tour={tours.find((t) => t.id === tourCard.tourId)}
        />
      ))}
    </div>
  );
}

/**
 * Returns all tour cards for a given tour with position <= 15 (including ties at 15).
 */
function getGoldCutCards(
  tour: Tour & { tourCards?: TourCard[] },
): (TourCard & { points?: number; position?: string | number })[] {
  const cards = getTourCardsForTour(tour);
  return cards.filter((card) => parsePosition(card.position) <= 15);
}

/**
 * Returns all tour cards for a given tour with 16 <= position <= 35 (including ties).
 */
function getSilverCutCards(
  tour: Tour & { tourCards?: TourCard[] },
): (TourCard & { points?: number; position?: string | number })[] {
  const cards = getTourCardsForTour(tour);
  return cards.filter((card) => {
    const pos = parsePosition(card.position);
    return pos >= 16 && pos <= 35;
  });
}

/**
 * Returns all tour cards for a given tour with position > 35.
 */
function getRemainingCards(
  tour: Tour & { tourCards?: TourCard[] },
): (TourCard & { points?: number; position?: string | number })[] {
  const cards = getTourCardsForTour(tour);
  return cards.filter((card) => parsePosition(card.position) > 35);
}

/**
 * Helper to get all tour cards for a tour, sorted by points descending.
 * Assumes tourCards are attached to the tour, or can be filtered from global state.
 */
function getTourCardsForTour(
  tour: Tour & { tourCards?: TourCard[] },
): (TourCard & { points?: number; position?: string | number })[] {
  let cards: (TourCard & { points?: number; position?: string | number })[] =
    [];
  if (tour.tourCards) {
    cards = tour.tourCards as (TourCard & {
      points?: number;
      position?: string | number;
    })[];
  } else if (
    typeof window !== "undefined" &&
    (window as Window & { allTourCards?: TourCard[] }).allTourCards
  ) {
    cards = (
      (window as Window & { allTourCards?: TourCard[] }).allTourCards ?? []
    )
      .map((a) => {
        return {
          ...a,
          points: a.points ?? 0,
          position: a.position ?? undefined,
        } as TourCard & { points?: number; position?: string | number };
      })
      .filter((tc) => tc.tourId === tour.id);
  }
  return cards.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
}

/**
 * Parses a position string/number (e.g., "T15", 12, "1") to a number for comparison.
 * Returns Infinity if not parseable.
 */
function parsePosition(pos: string | number | undefined | null): number {
  if (typeof pos === "number") return pos;
  if (typeof pos === "string") {
    const match = /\d+/.exec(pos);
    if (match) return parseInt(match[0], 10);
  }
  return Infinity;
}
