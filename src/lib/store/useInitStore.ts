"use client";

import { useState, useEffect } from "react";
import { loadInitialData } from "./mainInit";
import { initializeLeaderboardStore } from "./leaderboardInit";

// Create a global variable to track initialization status
let storeInitialized = false;
let initializationError: string | null = null;

export function resetInitialization() {
  storeInitialized = false;
  initializationError = null;
}

export function useInitStore() {
  const [isLoading, setIsLoading] = useState(!storeInitialized);
  const [error, setError] = useState<string | null>(initializationError);

  useEffect(() => {
    // Skip if already initialized
    if (storeInitialized) {
      return;
    }

    // Ensure we're only in the browser
    if (typeof window !== "undefined") {
      const initialize = async () => {
        try {
          await loadInitialData();
          await initializeLeaderboardStore();
          storeInitialized = true;
          setIsLoading(false);
        } catch (err) {
          console.error("Failed to load initial data:", err);
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error loading data";
          initializationError = errorMessage;
          setError(errorMessage);
          setIsLoading(false);
        }
      };

      // Initialize immediately - no need for delay since we use a global flag
      initialize().catch((err) => {
        console.error("Unexpected error during initialization:", err);
      });
    }
  }, []);

  return { isLoading, error };
}
