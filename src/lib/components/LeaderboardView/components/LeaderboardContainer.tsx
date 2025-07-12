"use client";

/**
 * LeaderboardContainer - Main container component that fetches data and displays the leaderboard
 */

import React, { useState, useEffect } from "react";
import { useLeaderboardData } from "../hooks/useLeaderboardData";
import { useLeaderboardLogic } from "../hooks/useLeaderboardLogic";
import { useSearchParams } from "next/navigation";
import { PGCLeaderboard } from "./PGCLeaderboard";
import { PGALeaderboard } from "./PGALeaderboard";
import { ToursToggleButton } from "../../smartComponents/functionalComponents/client/ToursToggle";
import { LeaderboardHeaderRow } from "./UIComponents";

interface LeaderboardContainerProps {
  tournamentId: string;
  variant?: "regular" | "playoff" | "historical";
  inputTour?: string;
  userId?: string;
  onRefetch?: () => void;
}

export const LeaderboardContainer: React.FC<LeaderboardContainerProps> = ({
  tournamentId,
  variant = "regular",
  inputTour,
  userId,
  onRefetch,
}) => {
  const searchParams = useSearchParams();
  const { props, loading, error, refetch } = useLeaderboardData({
    tournamentId,
    variant,
    inputTour: searchParams.get("tourId") ?? inputTour,
    userId,
  });

  // Use the leaderboard logic to determine tours and default selection
  const { toggleTours, defaultToggle } = useLeaderboardLogic({
    variant: variant === "historical" ? "regular" : variant,
    tours: props?.tours,
    tourCards: props?.tourCards,
    inputTourId: props?.inputTour,
  });

  const [activeTour, setActiveTour] = useState<string>(defaultToggle);

  // Update activeTour when props change
  useEffect(() => {
    if (defaultToggle && !activeTour) {
      setActiveTour(defaultToggle);
    }
  }, [defaultToggle, activeTour]);

  // Call onRefetch prop when refetch is called
  const handleRefetch = () => {
    refetch();
    onRefetch?.();
  };

  if (loading) {
    return (
      <div className="mx-auto mt-8 w-full max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-lg font-semibold">Loading leaderboard...</div>
        </div>
      </div>
    );
  }

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

      {/* Conditional leaderboard rendering */}
      {activeTour === "pga" ? (
        <PGALeaderboard
          golfers={props.golfers}
          tournament={props.tournament}
          tourCard={props.tourCard}
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
        />
      )}
    </div>
  );
};
