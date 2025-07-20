/**
 * StandingsView - Main orchestrating component
 *
 * This is the primary entry point for the StandingsView component.
 * It fetches all necessary data using custom hooks and renders the appropriate
 * child components based on the data and user interactions.
 *
 * The component follows a container pattern where:
 * - Hooks manage data fetching and business logic
 * - Child components handle pure rendering
 * - State is managed at this level and passed down
 *
 * @param initialTourId - Optional initial tour ID to display
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { useStandingsData } from "./hooks/useStandingsData";
import { useFriendManagement } from "./hooks/useFriendManagement";
import {
  StandingsHeader,
  ToursToggle,
  FriendsOnlyToggle,
  StandingsLoadingSkeleton,
  StandingsError,
  StandingsContent,
} from "./components";
import type { StandingsViewProps } from "./utils/types";

/**
 * Main StandingsView Component
 *
 * Orchestrates data fetching, state management, and renders the appropriate UI.
 * All business logic and data fetching happens at this level and is passed down
 * to child components through props.
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

  // Friends-only filter state
  const [friendsOnly, setFriendsOnly] = useState<boolean>(false);

  // Update standings toggle when default changes (but not when user manually changes it)
  useEffect(() => {
    if (defaultTourId && !searchParams.get("tour")) {
      setStandingsToggle(defaultTourId);
    }
  }, [defaultTourId, searchParams]);

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
        friendsOnly={friendsOnly}
        setFriendsOnly={setFriendsOnly}
        disabled={!data?.currentMember}
        friendState={friendManagement.state}
        onAddFriend={friendManagement.actions.addFriend}
        onRemoveFriend={friendManagement.actions.removeFriend}
      />
    </div>
  );
}
