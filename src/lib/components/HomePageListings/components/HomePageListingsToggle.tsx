"use client";

/**
 * HomePageListingsToggle - Toggle component for switching between standings and leaderboard
 */

import React from "react";
import { cn } from "@pgc-utils";
import type { HomePageListingsToggleProps } from "../utils/types";

export const HomePageListingsToggle: React.FC<HomePageListingsToggleProps> = ({
  activeView,
  onViewChange,
}) => {
  return (
    <div className="mb-4 flex items-center justify-center gap-2">
      <button
        onClick={() => onViewChange("standings")}
        className={cn(
          "rounded-lg px-4 py-2 font-medium transition-colors",
          activeView === "standings"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300",
        )}
      >
        Standings
      </button>
      <button
        onClick={() => onViewChange("leaderboard")}
        className={cn(
          "rounded-lg px-4 py-2 font-medium transition-colors",
          activeView === "leaderboard"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 text-gray-700 hover:bg-gray-300",
        )}
      >
        Leaderboard
      </button>
    </div>
  );
};
