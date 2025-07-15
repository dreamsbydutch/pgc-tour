"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

import { useCurrentStandings, useFriendManagement } from "./hooks";
import { StandingsHeader } from "./components/StandingsHeader";
import { ToursToggle } from "./components/ToursToggle";
import { StandingsContent } from "./components/StandingsContent";
import { StandingsLoadingSkeleton } from "./components/StandingsLoadingSkeleton";
import { StandingsError } from "./components/StandingsError";

/**
 * StandingsView Component
 *
 * Main standings component - minimal orchestration only
 */
export function StandingsView() {
  const searchParams = useSearchParams();
  const {
    tours,
    tiers,
    tourCards,
    currentTourCard,
    currentMember,
    isLoading,
    error,
    refetch,
  } = useCurrentStandings();

  // Friend management hook
  const { friendChangingIds, handleAddFriend, handleRemoveFriend } =
    useFriendManagement(currentMember);

  const defaultTourId =
    searchParams.get("tour") ?? currentTourCard?.tourId ?? "";
  const [standingsToggle, setStandingsToggle] = useState<string>(defaultTourId);
  const displayedTour =
    tours?.find((tour) => tour.id === standingsToggle) ?? tours?.[0];

  if (isLoading) {
    return <StandingsLoadingSkeleton />;
  }

  if (error || !tours?.length) {
    return (
      <StandingsError
        error={error?.message || "Error loading standings"}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="w-full duration-500 animate-in fade-in">
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
        currentMember={currentMember}
        friendChangingIds={friendChangingIds}
        onAddFriend={handleAddFriend}
        onRemoveFriend={handleRemoveFriend}
      />
    </div>
  );
}
