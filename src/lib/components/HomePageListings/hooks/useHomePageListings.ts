"use client";

/**
 * HomePageListings - Hook for managing view state and logic
 */

import { useState, useCallback } from "react";
import { DEFAULT_VIEW_TYPE } from "../utils/constants";
import type { HomePageListingsViewType } from "../utils/types";

export function useHomePageListings(
  initialView: HomePageListingsViewType = DEFAULT_VIEW_TYPE,
) {
  const [activeView, setActiveView] =
    useState<HomePageListingsViewType>(initialView);

  const handleViewChange = useCallback((view: HomePageListingsViewType) => {
    setActiveView(view);
  }, []);

  const toggleView = useCallback(() => {
    setActiveView((prev) =>
      prev === "standings" ? "leaderboard" : "standings",
    );
  }, []);

  return {
    activeView,
    handleViewChange,
    toggleView,
  };
}
