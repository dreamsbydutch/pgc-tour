/**
 * @file CoursePopover.tsx
 * @description
 *   Displays a popover with detailed course and hole statistics for the current round.
 *   Fetches live course data and shows average score vs. par for each hole, with color-coded scoring.
 *
 *   Usage:
 *     <CoursePopover currentRound={1} />
 *
 *   Props:
 *     - currentRound: number | null — The round number to display stats for.
 */

"use client";

import LoadingSpinner from "@/lib/components/functionalComponents/loading/LoadingSpinner";
import { useCourseData } from "@/lib/hooks/hooks";
import { cn, formatRank, formatScore } from "@/lib/utils/main";

export function CoursePopover({
  /**
   * The current round number to display stats for.
   */
  currentRound,
}: {
  currentRound: number | null;
}) {
  // Fetch course data (live hole stats)
  const { data: courseData, isLoading } = useCourseData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <LoadingSpinner className="h-6 w-6" />
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="p-4 text-center text-gray-500">
        Course data not available
      </div>
    );
  }

  return (
    <>
      {/* Map over holes in the current round and display stats */}
      {courseData.courses[0]?.rounds
        ?.find((round) => round.round_num === currentRound)
        ?.holes?.map((hole, i) => {
          // Gather average scores for this hole across all rounds
          const holes = courseData.courses[0]?.rounds
            ?.map(
              (round) =>
                round.holes.find((h) => h.hole === hole.hole)?.total.avg_score,
            )
            .filter((score): score is number => typeof score === "number");

          // Calculate the average score for this hole
          const averageScore = holes?.length
            ? holes.reduce((sum, score) => sum + score, 0) / holes.length
            : 0;

          // Difference from par for this hole
          const scoreDifference = averageScore - hole.par;
          // Format the score for display (E, +N, -N)
          const formattedScore = formatScore(scoreDifference) || "-";

          return (
            <div
              key={i}
              className="grid grid-cols-4 border-slate-800 py-0.5 text-center [&:nth-child(9)]:border-b"
            >
              <div className="mx-auto flex w-fit flex-col">
                <div className="text-xs">{formatRank(hole.hole)} Hole</div>
              </div>
              <div className="mx-auto flex w-fit flex-col">
                <div className="text-xs">{hole.yardage} yards</div>
              </div>
              <div className="mx-auto flex w-fit flex-col">
                <div className="text-xs">Par {hole.par}</div>
              </div>
              <div className="mx-auto flex w-fit flex-col">
                <div
                  className={cn(
                    "text-xs",
                    scoreDifference > 0
                      ? "text-red-900"
                      : scoreDifference < 0
                        ? "text-green-900"
                        : "",
                  )}
                >
                  {formattedScore}
                </div>
              </div>
            </div>
          );
        })}
    </>
  );
}
