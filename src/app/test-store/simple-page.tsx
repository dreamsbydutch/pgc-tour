"use client";

import React from "react";
import { usePGCTourStore } from "@/src/lib/store";

export default function TestStorePage() {
  console.log("TestStorePage rendering...");

  // Try to access just the basic store state
  try {
    const storeState = usePGCTourStore((state) => ({
      authLoading: state.authLoading,
      isAuthenticated: state.isAuthenticated,
      selectedTournamentId: state.selectedTournamentId,
    }));

    console.log("Store state accessed successfully:", storeState);

    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-3xl font-bold">Simple Store Test</h1>

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-xl font-semibold">Basic State</h2>
          <div className="space-y-2">
            <p>
              <strong>Auth Loading:</strong>{" "}
              {storeState.authLoading ? "Yes" : "No"}
            </p>
            <p>
              <strong>Authenticated:</strong>{" "}
              {storeState.isAuthenticated ? "Yes" : "No"}
            </p>
            <p>
              <strong>Selected Tournament:</strong>{" "}
              {storeState.selectedTournamentId || "None"}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-green-600">✅ Store is working properly!</p>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Store error:", error);
    return (
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-3xl font-bold text-red-600">Store Error</h1>
        <div className="rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="text-red-800">
            <strong>Error:</strong>{" "}
            {error instanceof Error ? error.message : String(error)}
          </p>
          {error instanceof Error && error.stack && (
            <pre className="mt-2 text-xs text-red-600">{error.stack}</pre>
          )}
        </div>
      </div>
    );
  }
}
