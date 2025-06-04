"use client";

import { useState, useEffect } from "react";
import { loadInitialData } from "./mainInit";
import { initializeLeaderboardStore } from "./leaderboardInit";

// Create a global variable to track initialization status
let storeInitialized = false;
let initializationError: string | null = null;
let isCurrentlyInitializing = false; // Prevent concurrent initializations

// Force reset in development for hot reloading
if (process.env.NODE_ENV === "development") {
  // Reset on module reload
  storeInitialized = false;
  initializationError = null;
  isCurrentlyInitializing = false;
}

export function resetInitialization() {
  console.log("🔄 Resetting store initialization state");
  storeInitialized = false;
  initializationError = null;
  isCurrentlyInitializing = false;
}

export function useInitStore() {
  const [isLoading, setIsLoading] = useState(!storeInitialized);
  const [error, setError] = useState<string | null>(initializationError);

  useEffect(() => {
    // Skip if already initialized or currently initializing
    if (storeInitialized || isCurrentlyInitializing) {
      console.log("✅ Store already initialized or initializing, skipping");
      return;
    }

    // Ensure we're only in the browser
    if (typeof window !== "undefined") {
      console.log("🔄 Starting store initialization...");
      
      // Mark as currently initializing to prevent concurrent calls
      isCurrentlyInitializing = true;
      
      const initialize = async () => {
        try {
          console.log("📡 Loading initial data...");
          await loadInitialData();

          // Initialize leaderboard store after main store is loaded
          try {
            console.log("📊 Initializing leaderboard store...");
            await initializeLeaderboardStore();
            console.log("✅ Leaderboard store initialized successfully");
          } catch (leaderboardError) {
            console.warn(
              "⚠️ Failed to initialize leaderboard store:",
              leaderboardError,
            );
            // Don't fail the entire initialization if leaderboard fails
          }

          storeInitialized = true;
          isCurrentlyInitializing = false;
          console.log("✅ Store initialization completed");
          setIsLoading(false);
        } catch (err) {
          console.error("❌ Failed to load initial data:", err);
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error loading data";
          initializationError = errorMessage;
          isCurrentlyInitializing = false;
          setError(errorMessage);
          setIsLoading(false);
        }
      };

      // Initialize immediately - no need for delay since we use a global flag
      initialize().catch((err) => {
        console.error("💥 Unexpected error during initialization:", err);
        isCurrentlyInitializing = false;
      });
    }
  }, []);

  return { isLoading, error };
}

// Create a global variable to track initialization status
let leaderboardStoreInitialized = false;
let leaderboardInitializationError: string | null = null;

export function resetLeaderboardInitialization() {
  leaderboardStoreInitialized = false;
  leaderboardInitializationError = null;
}
export function useInitLeaderboardStore() {
  const [isLoading, setIsLoading] = useState(!leaderboardStoreInitialized);
  const [error, setError] = useState<string | null>(
    leaderboardInitializationError,
  );

  useEffect(() => {
    // Skip if already initialized
    if (leaderboardStoreInitialized) {
      return;
    }

    // Ensure we're only in the browser
    if (typeof window !== "undefined") {
      const initialize = async () => {
        try {
          await initializeLeaderboardStore();
          leaderboardStoreInitialized = true;
          setIsLoading(false);
        } catch (err) {
          console.error("Failed to load initial data:", err);
          const errorMessage =
            err instanceof Error ? err.message : "Unknown error loading data";
          leaderboardInitializationError = errorMessage;
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
