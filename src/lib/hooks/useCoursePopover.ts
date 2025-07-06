/**
 * Course Popover Hook
 *
 * Client-side hook for fetching and processing live course data from DataGolf API.
 * Follows the pattern: all client data fetching should be in hooks folder.
 */

import { useCourseData } from "@/lib/hooks/useCourseData";
import { formatScore } from "@/lib/utils/domain/golf";
import { formatRank } from "@/lib/utils/domain/formatting";
import type { DatagolfCourseInputData } from "@/lib/types";

export interface CoursePopoverData {
  courseData: DatagolfCourseInputData | undefined;
  isLoading: boolean;
  error: Error | null;
  holes: Array<{
    holeNumber: number;
    yardage: number;
    par: number;
    averageScore: number;
    scoreToPar: string | number | null;
    formattedHoleNumber: string;
  }> | null;
}

/**
 * Hook for course popover data and hole processing
 * Uses utility functions for all data manipulation and formatting
 *
 * @param tournament - Current tournament for round filtering
 * @returns Processed course data with formatted hole information
 */
export function useCoursePopover(
  currentRound: number | null,
): CoursePopoverData {
  // Fetch live course data from DataGolf API
  const { data: courseData, isLoading, error } = useCourseData();

  // Process hole data using utility functions
  const holes =
    courseData?.courses[0]?.rounds
      ?.find((round) => round.round_num === currentRound)
      ?.holes?.map((hole) => {
        // Calculate average score using inline logic (specific to DataGolf structure)
        const holeScores = courseData.courses[0]?.rounds
          ?.map(
            (round) =>
              round.holes.find((h) => h.hole === hole.hole)?.total.avg_score,
          )
          .filter((score): score is number => typeof score === "number");

        const averageScore = holeScores?.length
          ? holeScores.reduce((sum, score) => sum + score, 0) /
            holeScores.length
          : 0;

        // Calculate score to par and format using existing utilities
        const scoreDifference = averageScore - hole.par;
        const scoreToPar = formatScore(scoreDifference);

        return {
          holeNumber: hole.hole,
          yardage: hole.yardage,
          par: hole.par,
          averageScore,
          scoreToPar,
          formattedHoleNumber: formatRank(hole.hole),
        };
      }) || null;

  return {
    courseData,
    isLoading,
    error,
    holes,
  };
}
