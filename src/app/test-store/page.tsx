"use client";

import React from "react";
import { usePGCTourStore } from "@/src/lib/store";
import {
  useSeasonData,
  useCurrentSeason,
} from "@/src/lib/store/persistent-selectors";

export default function TestStorePage() {
  const {
    isAuthenticated,
    authLoading,
    authUser,
    selectedTournamentId,
    setSelectedTournament,
    clearAll,
    currentSeason,
    tours,
    tournaments,
    tourCards,
    courses,
  } = usePGCTourStore();

  // Temporarily access data directly from store instead of using selector hooks
  // const currentSeason = useCurrentSeason();
  // const seasonData = useSeasonData();

  const handleTestPersistence = () => {
    // Set some data to test persistence
    setSelectedTournament("test-tournament-123");
  };

  const handleClearData = () => {
    clearAll();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Store Test Page</h1>

      <div className="grid gap-6">
        {/* Auth State */}
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-xl font-semibold">Auth State</h2>
          <div className="space-y-2">
            <p>
              <strong>Loading:</strong> {authLoading ? "Yes" : "No"}
            </p>
            <p>
              <strong>Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}
            </p>
            <p>
              <strong>User:</strong> {authUser?.email || "None"}
            </p>
          </div>
        </div>

        {/* UI State */}
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-xl font-semibold">UI State</h2>
          <div className="space-y-2">
            <p>
              <strong>Selected Tournament:</strong>{" "}
              {selectedTournamentId || "None"}
            </p>
          </div>
          <div className="mt-4 space-x-2">
            <button
              onClick={handleTestPersistence}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Set Test Tournament
            </button>
            <button
              onClick={handleClearData}
              className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
            >
              Clear All Data
            </button>
          </div>
        </div>

        {/* Data State */}
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-xl font-semibold">Data State</h2>
          <div className="space-y-2">
            {" "}
            <p>
              <strong>Current Season:</strong>{" "}
              {currentSeason.currentSeason?.year || "None"}
            </p>
            <p>
              <strong>Tours Count:</strong> {seasonData.tours.length}
            </p>
            <p>
              <strong>Tournaments Count:</strong>{" "}
              {seasonData.tournaments.length}
            </p>
            <p>
              <strong>Tour Cards Count:</strong> {seasonData.tourCards.length}
            </p>
            <p>
              <strong>Courses Count:</strong> {seasonData.courses.length}
            </p>
          </div>
        </div>

        {/* Persistence Test */}
        <div className="rounded-lg border bg-yellow-50 p-4">
          <h2 className="mb-3 text-xl font-semibold">Persistence Test</h2>
          <p className="mb-3 text-sm text-gray-600">
            To test persistence: Click "Set Test Tournament", refresh the page,
            and check if the value persists.
          </p>
          <p className="text-sm text-gray-500">
            Auth state should NOT persist (will reset on refresh), but UI and
            data state should persist.
          </p>
        </div>

        {/* localStorage Inspection */}
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-xl font-semibold">
            localStorage Inspection
          </h2>
          <button
            onClick={() => {
              const stored = localStorage.getItem("pgc-tour-store");
              console.log("Stored data:", stored);
              alert(
                `Check console for stored data. Preview: ${stored?.substring(0, 100)}...`,
              );
            }}
            className="rounded bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Check localStorage
          </button>
        </div>
      </div>
    </div>
  );
}
