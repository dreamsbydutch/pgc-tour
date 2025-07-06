"use client";

import { useCoursePopover } from "@/lib/hooks/useCoursePopover";
import LoadingSpinner from "@/lib/components/functionalComponents/loading/LoadingSpinner";
import { formatScore } from "@/lib/utils/domain/golf";
import { formatRank, formatNumber } from "@/lib/utils/domain/formatting";
import { cn } from "@/lib/utils/core";
import type { Tournament } from "@prisma/client";

interface CoursePopoverProps {
  tournament: Tournament;
}

export function CoursePopover({ tournament }: CoursePopoverProps) {
  const { courseData, isLoading } = useCoursePopover(tournament);

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
      {courseData.courses[0]?.rounds
        ?.find((round) => round.round_num === tournament.currentRound)
        ?.holes?.map((hole, i) => {
          const holes = courseData.courses[0]?.rounds
            ?.map(
              (round) =>
                round.holes.find((h) => h.hole === hole.hole)?.total.avg_score,
            )
            .filter((score): score is number => typeof score === "number");

          const averageScore = holes?.length
            ? holes.reduce((sum, score) => sum + score, 0) / holes.length
            : 0;

          const scoreDifference = averageScore - hole.par;
          const formattedScore = formatScore(scoreDifference) || "E";

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
