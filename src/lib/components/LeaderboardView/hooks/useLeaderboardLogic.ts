/**
 * Custom hooks for LeaderboardView
 */

import { useMemo } from "react";
import { PLAYOFF_CONFIGS } from "./constants";
import type { LeaderboardViewProps } from "./types";

export const useLeaderboardLogic = (props: LeaderboardViewProps) => {
  const { variant, tours = [], tourCards = [], inputTour = "" } = props;

  const toggleTours = useMemo(() => {
    if (variant === "playoff") {
      const maxPlayoff = Math.max(
        ...(tourCards?.map((card) => card.playoff) ?? []),
      );
      return maxPlayoff > 1
        ? [PLAYOFF_CONFIGS.gold, PLAYOFF_CONFIGS.silver, PLAYOFF_CONFIGS.pga]
        : [PLAYOFF_CONFIGS.solo, PLAYOFF_CONFIGS.pga];
    }

    return [...tours, PLAYOFF_CONFIGS.pga];
  }, [variant, tours, tourCards]);

  const defaultToggle = useMemo(() => {
    if (variant === "playoff") return "gold";
    if (inputTour) return inputTour;
    return toggleTours[0]?.id ?? "";
  }, [variant, inputTour, toggleTours]);

  return { toggleTours, defaultToggle };
};
