/**
 * Custom hooks for LeaderboardView
 */

import { useMemo } from "react";
import { PLAYOFF_CONFIGS } from "../utils/constants";

export const useLeaderboardLogic = (props: {
  variant: "regular" | "playoff";
  tours?: {
    id: string;
    name: string;
    shortform: string;
    logoUrl: string | null;
  }[];
  tourCards?: { playoff: number }[];
  inputTourId?: string;
}) => {
  const { variant, tours = [], tourCards = [], inputTourId = "" } = props;

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
    if (inputTourId) return inputTourId;
    return toggleTours[0]?.id ?? "";
  }, [variant, inputTourId, toggleTours]);

  return { toggleTours, defaultToggle };
};
