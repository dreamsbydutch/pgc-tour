"use client";

import { useState } from "react";
import {
  StandingsHeader,
  StandingsListing,
} from "@/lib/components/functionalComponents/client/StandingsPage";
import {
  useCurrentStandings,
  StandingsTour,
  StandingsTier,
  UseCurrentStandingsResult,
} from "@/lib/hooks/useCurrentStandings";
import {
  getGoldCutCards,
  getSilverCutCards,
  getRemainingCards,
  getGoldTeams,
  getSilverTeams,
  getPlayoffTier,
} from "@/lib/utils/standings/helpers";
import type { TourCard } from "@prisma/client";
import { ToursToggleButton } from "@/lib/components/functionalComponents/client/ToursToggle";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();
  const {
    tours,
    isLoading,
    error,
    userTourCard,
    activeTour,
    tiers,
    member,
  }: UseCurrentStandingsResult = useCurrentStandings();

  // Get default tour from search params if present
  const defaultTourId = searchParams.get("tour") || activeTour?.id || "";
  const [standingsToggle, setStandingsToggle] = useState<string>(defaultTourId);

  // Update activeTour when toggle changes
  const displayedTour: StandingsTour | undefined =
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
              name: "Playoffs",
              shortForm: "Playoffs",
              seasonId: userTourCard?.seasonId ?? "",
              id: "playoffs",
              buyIn: 0,
              playoffSpots: [30, 40],
              logoUrl:
                "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC",
              updatedAt: new Date(),
              createdAt: new Date(),
              // tourCards: [], // Removed property not in type
            }}
            tourToggle={standingsToggle}
            setTourToggle={setStandingsToggle}
          />
        </div>
      )}
      {standingsToggle === "playoffs" ? (
        <PlayoffStandings tours={tours} tiers={tiers} />
      ) : (
        <TourStandings activeTour={displayedTour} />
      )}
    </>
  );
}

// Abstracted TourStandings logic
function TourStandings({
  activeTour,
}: {
  activeTour: StandingsTour | undefined;
}) {
  if (!activeTour) return null;

  const goldCutCards = getGoldCutCards(activeTour);
  const silverCutCards = getSilverCutCards(activeTour);
  const remainingCards = getRemainingCards(activeTour);

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
  tiers,
}: {
  tours: StandingsTour[];
  tiers: StandingsTier[];
}) {
  const goldTeams = getGoldTeams(tours);
  const silverTeams = getSilverTeams(tours);
  const playoffTier = getPlayoffTier(tiers);

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
          payouts: playoffTier?.payouts.slice(75, 85) ?? [],
          points: playoffTier?.points.slice(75, 85) ?? [],
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
