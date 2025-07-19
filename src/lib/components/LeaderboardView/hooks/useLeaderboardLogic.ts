/**
 * Custom hook for LeaderboardView business logic
 *
 * This hook handles the business logic for determining which tours should be
 * available for toggling and which tour should be selected by default.
 * It handles both regular tournament and playoff variants.
 *
 * @param props - Configuration object with variant, tours, tourCards, and inputTourId
 * @returns Object containing toggleTours array and defaultToggle string
 */

import { useMemo } from "react";
import { PLAYOFF_CONFIGS } from "../utils/constants";
import type { LeaderboardTour, LeaderboardTourCard } from "../utils/types";

/**
 * Parameters for useLeaderboardLogic hook
 */
interface UseLeaderboardLogicProps {
  /** Leaderboard variant type */
  variant: "regular" | "playoff";
  /** Available tours from data */
  tours?: LeaderboardTour[];
  /** Available tour cards from data */
  tourCards?: LeaderboardTourCard[];
  /** Input tour ID from props/URL */
  inputTourId?: string;
}

/**
 * Return type for useLeaderboardLogic hook
 */
interface UseLeaderboardLogicReturn {
  /** Array of tours available for toggling */
  toggleTours: LeaderboardTour[];
  /** Default tour ID to select */
  defaultToggle: string;
}

/**
 * Hook for determining leaderboard tour logic
 *
 * This hook calculates which tours should be available for the user to toggle between
 * and which tour should be selected by default based on the variant type and available data.
 */
export const useLeaderboardLogic = (
  props: UseLeaderboardLogicProps,
): UseLeaderboardLogicReturn => {
  const { variant, tours = [], tourCards = [], inputTourId = "" } = props;

  /**
   * Calculate available toggle tours based on variant type
   * - For playoffs: Determine gold/silver or single playoff based on max playoff level
   * - For regular: Include all regular tours plus PGA
   */
  const toggleTours = useMemo(() => {
    if (variant === "playoff") {
      const maxPlayoff = Math.max(
        ...(tourCards?.map((card) => card.playoff ?? 0) ?? []),
      );
      return maxPlayoff > 1
        ? [PLAYOFF_CONFIGS.gold, PLAYOFF_CONFIGS.silver, PLAYOFF_CONFIGS.pga]
        : [PLAYOFF_CONFIGS.solo, PLAYOFF_CONFIGS.pga];
    }

    return [...tours, PLAYOFF_CONFIGS.pga];
  }, [variant, tours, tourCards]);

  /**
   * Determine default tour selection based on variant and input
   * - For playoffs: Default to "gold"
   * - For regular: Use inputTourId if provided, otherwise first available tour
   */
  const defaultToggle = useMemo(() => {
    if (variant === "playoff") return "gold";
    if (inputTourId) return inputTourId;
    return toggleTours[0]?.id ?? "";
  }, [variant, inputTourId, toggleTours]);

  return { toggleTours, defaultToggle };
};
