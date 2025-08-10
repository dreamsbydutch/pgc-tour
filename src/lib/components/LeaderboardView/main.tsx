/**
 * LeaderboardView - Main orchestrating component
 *
 * This is the primary entry point for the LeaderboardView component.
 * It fetches all necessary data using custom hooks and renders the appropriate
 * child components based on the data and user interactions.
 *
 * The component follows a container pattern where:
 * - Hooks manage data fetching and business logic
 * - Child components handle pure rendering
 * - State is managed at this level and passed down
 */

"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useLeaderboardData } from "./hooks/useLeaderboardData";
import { useLeaderboardLogic } from "./hooks/useLeaderboardLogic";
import { PGCLeaderboard } from "./components/PGCLeaderboard";
import { PGALeaderboard } from "./components/PGALeaderboard";
import { PlayoffLeaderboard } from "./components/PlayoffLeaderboard";
import { LeaderboardHeaderRow } from "./components/UIComponents";
import { ToursToggleButton } from "@pgc-components";

/**
 * Props for the LeaderboardView component
 */
interface LeaderboardViewProps {
  /** Tournament ID to display leaderboard for */
  tournamentId: string;
  /** Leaderboard variant type */
  variant?: "regular" | "playoff" | "historical";
  /** Optional tour ID from external source */
  inputTour?: string;
  /** Optional user ID for personalization */
  userId?: string;
  /** Whether this is pre-tournament display */
  isPreTournament?: boolean;
  /** Callback fired when data is refetched */
  onRefetch?: () => void;
}

/**
 * Main LeaderboardView component
 *
 * This component orchestrates the entire leaderboard display by:
 * 1. Fetching data using useLeaderboardData hook
 * 2. Determining tour logic using useLeaderboardLogic hook
 * 3. Managing active tour state
 * 4. Rendering appropriate child components
 */
export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  tournamentId,
  variant = "regular",
  inputTour,
  userId,
  isPreTournament = false,
  onRefetch,
}) => {
  const searchParams = useSearchParams();

  // Fetch all data needed for the leaderboard
  const { props, loading, error, refetch } = useLeaderboardData({
    tournamentId,
    variant,
    inputTour: searchParams.get("tourId") ?? inputTour,
    userId,
  });

  // Determine tour toggle logic based on data and variant
  const { toggleTours, defaultToggle, isPlayoff, maxPlayoffLevel } =
    useLeaderboardLogic({
      variant: variant === "historical" ? "regular" : variant,
      tours: props?.tours,
      tourCards: props?.tourCards,
      tournament: props?.tournament,
      inputTourId: props?.inputTour,
    });

  // State for currently active tour
  const [activeTour, setActiveTour] = useState<string>("");

  // Initialize activeTour from localStorage or defaultToggle
  useEffect(() => {
    if (toggleTours.length > 0 && defaultToggle) {
      // Check localStorage for stored activeTour (client-side only)
      const storedActiveTour = localStorage.getItem("activeTour");

      // Validate that stored tour exists in current toggleTours
      const isStoredTourValid =
        storedActiveTour &&
        toggleTours.some((tour) => tour.id === storedActiveTour);

      // Use stored tour if valid, otherwise use defaultToggle
      const tourToSet = isStoredTourValid ? storedActiveTour : defaultToggle;

      // Only set if different from current to avoid unnecessary re-renders
      if (tourToSet !== activeTour) {
        setActiveTour(tourToSet);
      }
    }
  }, [defaultToggle, toggleTours, activeTour, props?.teams]);

  // Separate effect to validate stored tour when teams data becomes available
  useEffect(() => {
    if (props?.teams && activeTour && activeTour !== "pga") {
      // Check if current activeTour has any teams
      const currentTourHasTeams = props.teams.some(
        (team) => team.tourCard?.tourId === activeTour,
      );

      // If no teams found for current tour, but we have teams for other tours,
      // and defaultToggle is different, switch to defaultToggle
      if (
        !currentTourHasTeams &&
        props.teams.length > 0 &&
        activeTour !== defaultToggle
      ) {
        // Check if defaultToggle has teams
        const defaultHasTeams =
          defaultToggle === "pga" ||
          props.teams.some((team) => team.tourCard?.tourId === defaultToggle);

        if (defaultHasTeams) {
          setActiveTour(defaultToggle);
        }
      }
    }
  }, [props?.teams, activeTour, defaultToggle]);

  // Safety fallback - ensure we have a valid activeTour after data loads
  useEffect(() => {
    // If we have data but no activeTour, force set one
    if (!loading && !error && props && toggleTours.length > 0 && !activeTour) {
      const fallbackTour = defaultToggle || toggleTours[0]?.id || "pga";
      setActiveTour(fallbackTour);
    }
  }, [loading, error, props, toggleTours, activeTour, defaultToggle]);

  // Additional safety check - if we have tours but no active tour for too long, force one
  useEffect(() => {
    if (toggleTours.length > 0 && !activeTour) {
      const timeoutId = setTimeout(() => {
        const fallbackTour = defaultToggle || toggleTours[0]?.id || "pga";
        setActiveTour(fallbackTour);
      }, 2000); // 2 second timeout

      return () => clearTimeout(timeoutId);
    }
  }, [toggleTours, activeTour, defaultToggle]);

  /**
   * Handle data refetch - combines internal refetch with optional callback
   */
  const handleRefetch = () => {
    refetch();
    onRefetch?.();
  };

  // Loading state with better feedback
  if (loading || !props || toggleTours.length === 0) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <div className="mx-auto max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-lg">
          <div className="text-center">
            {/* Loading spinner */}
            <div className="mb-6 flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600"></div>
            </div>

            {/* Main loading message */}
            <h2 className="mb-3 font-yellowtail text-3xl text-slate-800">
              Loading Leaderboard
            </h2>

            {/* Subtitle */}
            <p className="font-varela text-sm text-slate-600">
              Gathering the latest tournament scores and standings...
            </p>

            {/* Animated dots */}
            <div className="mt-4 flex justify-center space-x-1">
              <div className="h-2 w-2 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.3s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.15s]"></div>
              <div className="h-2 w-2 animate-bounce rounded-full bg-slate-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry option
  if (error) {
    return (
      <div className="mx-auto mt-8 w-full max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg font-semibold text-red-600">
            Error: {error}
          </div>
          <button
            onClick={handleRefetch}
            className="ml-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state - only for actual errors or truly empty states after loading
  if (!loading && error && !props) {
    return (
      <div className="mx-auto mt-8 w-full max-w-4xl">
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="text-lg font-semibold">Tournament not found</div>
          <div className="text-center text-sm text-red-500">
            Failed to load tournament data
          </div>
          <button
            onClick={handleRefetch}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-2 w-full max-w-4xl md:w-11/12 lg:w-8/12">
      {/* Tour toggle buttons */}
      <div className="mx-auto my-4 flex w-full max-w-xl items-center justify-center gap-4">
        {toggleTours.map((tour) => (
          <ToursToggleButton
            key={tour.id}
            setTourToggle={setActiveTour}
            tour={{
              id: tour.id,
              shortForm: tour.shortForm,
              logoUrl: tour.logoUrl ?? "",
            }}
            tourToggle={activeTour}
          />
        ))}
      </div>

      {/* Leaderboard header */}
      <LeaderboardHeaderRow
        tournamentOver={props.tournament.currentRound === 5}
        activeTour={
          toggleTours.find((tour) => tour.id === activeTour)?.shortForm ?? ""
        }
      />

      {/* Conditional leaderboard rendering based on playoff detection and active tour */}
      {!activeTour ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-lg font-semibold">Loading tour selection...</div>
        </div>
      ) : isPlayoff &&
        (activeTour === "gold" ||
          activeTour === "silver" ||
          (activeTour === "playoffs" && maxPlayoffLevel === 1)) ? (
        <PlayoffLeaderboard
          teams={props.teams}
          golfers={props.golfers}
          tournament={props.tournament}
          tourCard={props.tourCard}
          member={props.member}
          activeTour={activeTour}
          isPreTournament={isPreTournament}
        />
      ) : activeTour === "pga" ? (
        <PGALeaderboard
          golfers={props.golfers}
          tournament={props.tournament}
          tourCard={props.tourCard}
          isPreTournament={isPreTournament}
        />
      ) : (
        <PGCLeaderboard
          teams={props.teams}
          golfers={props.golfers}
          tournament={props.tournament}
          tourCard={props.tourCard}
          member={props.member}
          activeTour={activeTour}
          variant={variant === "historical" ? "regular" : variant}
          isPreTournament={isPreTournament}
        />
      )}
    </div>
  );
};
