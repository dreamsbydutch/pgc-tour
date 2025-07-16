"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { useStandingsData } from "./hooks/useStandingsData";
import { useFriendManagement } from "./hooks/useFriendManagement";
import { StandingsHeader } from "./components/StandingsHeader";
import { ToursToggle } from "./components/ToursToggle";
import { StandingsContent } from "./components/StandingsContent";
import { StandingsLoadingSkeleton } from "./components/StandingsLoadingSkeleton";
import { StandingsError } from "./components/StandingsError";
import type { StandingsViewProps } from "./types";

/**
 * Main StandingsView Component
 *
 * Orchestrates data fetching, state management, and renders the appropriate UI
 * All business logic and data fetching happens at this level
 */
export function StandingsView({ initialTourId }: StandingsViewProps = {}) {
  const searchParams = useSearchParams();

  // Data fetching
  const { data, isLoading, error } = useStandingsData();

  // Friend management
  const friendManagement = useFriendManagement(data?.currentMember);

  // Tour selection state
  const defaultTourId = useMemo(() => {
    return (
      initialTourId ??
      searchParams.get("tour") ??
      data?.currentTourCard?.tourId ??
      data?.tours[0]?.id ??
      ""
    );
  }, [initialTourId, searchParams, data?.currentTourCard?.tourId, data?.tours]);

  const [standingsToggle, setStandingsToggle] = useState<string>(defaultTourId);

  // Update standings toggle when default changes
  if (
    defaultTourId &&
    standingsToggle !== defaultTourId &&
    !searchParams.get("tour")
  ) {
    setStandingsToggle(defaultTourId);
  }

  // Find displayed tour
  const displayedTour = useMemo(() => {
    if (!data?.tours) return undefined;
    return (
      data.tours.find((tour) => tour.id === standingsToggle) ?? data.tours[0]
    );
  }, [data?.tours, standingsToggle]);

  // Loading state
  if (isLoading) {
    return <StandingsLoadingSkeleton />;
  }

  // Error state
  if (error || !data?.tours?.length) {
    return (
      <StandingsError
        error={error?.message ?? "Error loading standings"}
        onRetry={() => window.location.reload()}
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
        tours={data.tours}
        standingsToggle={standingsToggle}
        setStandingsToggle={setStandingsToggle}
      />

      <StandingsContent
        standingsToggle={standingsToggle}
        data={data}
        friendState={friendManagement.state}
        onAddFriend={friendManagement.actions.addFriend}
        onRemoveFriend={friendManagement.actions.removeFriend}
      />
    </div>
  );
}
