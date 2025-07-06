"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/core/types";
import { useChampionTrophies } from "@/lib/hooks";

interface LittleFuckerProps {
  memberId: string;
  seasonId?: string;
}

export default function LittleFucker({
  memberId,
  seasonId,
}: LittleFuckerProps) {
  if (!memberId) return null;

  const { championTrophies, isLoading, showSeasonText, isLargeSize } =
    useChampionTrophies({
      memberId,
      seasonId,
    });

  if (isLoading || championTrophies.length === 0) return null;

  return (
    <div className="flex flex-row">
      {championTrophies.map((team) => {
        const { tournament } = team;
        if (!tournament) return null;
        return (
          <div
            key={team.id}
            className="flex flex-col items-center justify-center"
          >
            <Image
              src={
                tournament.name === "RBC Canadian Open" ||
                tournament.name === "Canadian Open"
                  ? "https://jn9n1jxo7g.ufs.sh/f/3f3580a5-8a7f-4bc3-a16c-53188869acb2-x8pl2f.png"
                  : tournament.name === "TOUR Championship"
                    ? "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC"
                    : (tournament.logoUrl ?? "")
              }
              alt={`${tournament.name} Championship Logo`}
              width={isLargeSize ? 192 : 128}
              height={isLargeSize ? 192 : 128}
              className={cn(
                "mx-0.5 inline-block",
                isLargeSize
                  ? tournament.name === "TOUR Championship"
                    ? "h-8 w-8"
                    : "h-6 w-6"
                  : tournament.name === "TOUR Championship"
                    ? "h-8 w-8"
                    : "h-6 w-6",
              )}
            />
            {showSeasonText && (
              <span
                className={cn(
                  "font-semibold text-slate-800",
                  isLargeSize
                    ? tournament.name === "TOUR Championship"
                      ? "text-sm"
                      : "text-xs"
                    : tournament.name === "TOUR Championship"
                      ? "text-xs"
                      : "text-2xs",
                )}
              >
                {tournament.startDate instanceof Date
                  ? tournament.startDate.getFullYear()
                  : new Date(tournament.startDate).getFullYear()}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
