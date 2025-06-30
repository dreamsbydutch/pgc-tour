"use client";

import React from "react";
import { useNonPersistentPGCTourStore } from "@/src/lib/store/store-no-persist";

export default function NonPersistentStoreTest() {
  console.log("NonPersistentStoreTest rendering...");

  try {
    const {
      authLoading,
      isAuthenticated,
      selectedTournamentId,
      setSelectedTournament,
      clearAll,
    } = useNonPersistentPGCTourStore();

    console.log("Non-persistent store accessed successfully");

    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-3xl font-bold">Non-Persistent Store Test</h1>

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-xl font-semibold">Store State</h2>
          <div className="space-y-2">
            <p>
              <strong>Auth Loading:</strong> {authLoading ? "Yes" : "No"}
            </p>
            <p>
              <strong>Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}
            </p>
            <p>
              <strong>Selected Tournament:</strong>{" "}
              {selectedTournamentId || "None"}
            </p>
          </div>

          <div className="mt-4 space-x-2">
            <button
              onClick={() => setSelectedTournament("test-" + Date.now())}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Set Test Tournament
            </button>
            <button
              onClick={clearAll}
              className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
            >
              Clear All
            </button>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-green-600">
            ✅ Non-persistent store is working properly!
          </p>
          <p className="text-sm text-gray-600">
            This store does NOT use persistence middleware
          </p>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Non-persistent store error:", error);
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-3xl font-bold text-red-600">Store Error</h1>
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="text-red-800">
            <strong>Error:</strong>{" "}
            {error instanceof Error ? error.message : String(error)}
          </p>
          {error instanceof Error && error.stack && (
            <pre className="mt-2 overflow-auto text-xs text-red-600">
              {error.stack}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
