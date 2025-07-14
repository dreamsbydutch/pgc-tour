"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { useCurrentStandings } from "../../hooks/hooks";
import { StandingsContent, StandingsHeader, ToursToggle } from "./components";

/**
 * StandingsView Component
 *
 * Main standings component - minimal orchestration only
 */
export function StandingsView() {
  const searchParams = useSearchParams();
  const { tours, tiers, tourCards, currentTourCard, isLoading, error } =
    useCurrentStandings();

  const defaultTourId =
    searchParams.get("tour") ?? currentTourCard?.tourId ?? "";
  const [standingsToggle, setStandingsToggle] = useState<string>(defaultTourId);
  const displayedTour =
    tours?.find((tour) => tour.id === standingsToggle) ?? tours?.[0];

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
    <div className="w-full">
      <StandingsHeader
        standingsToggle={standingsToggle}
        displayedTour={displayedTour}
      />

      <ToursToggle
        tours={tours}
        standingsToggle={standingsToggle}
        setStandingsToggle={setStandingsToggle}
      />

      <StandingsContent
        standingsToggle={standingsToggle}
        tours={tours}
        tiers={tiers}
        tourCards={tourCards}
        displayedTour={displayedTour}
      />
    </div>
  );
}
