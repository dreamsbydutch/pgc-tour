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
import { PlayoffDebugInfo } from "./components/PlayoffDebugInfo";
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
      inputTourId: props?.inputTour,
    });

  // State for currently active tour
  const [activeTour, setActiveTour] = useState<string>(defaultToggle);

  // Update activeTour when defaultToggle changes (e.g., data loads)
  useEffect(() => {
    if (defaultToggle && !activeTour) {
      setActiveTour(defaultToggle);
    }
  }, [defaultToggle, activeTour]);

  /**
   * Handle data refetch - combines internal refetch with optional callback
   */
  const handleRefetch = () => {
    refetch();
    onRefetch?.();
  };

  // Loading state
  if (loading) {
    return (
      <div className="mx-auto mt-8 w-full max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg font-semibold">Loading leaderboard...</div>
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

  // No data state
  if (!props) {
    return (
      <div className="mx-auto mt-8 w-full max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg font-semibold">Tournament not found</div>
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
      {isPlayoff &&
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
