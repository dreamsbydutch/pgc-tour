"use client";

import { api } from "@/src/trpc/react";
import Image from "next/image";
import { cn } from "../../../../old-utils";
import { useMemo } from "react";

interface LittleFuckerProps {
  memberId: string;
  seasonId?: string;
}

export default function LittleFucker({
  memberId,
  seasonId,
}: LittleFuckerProps) {
  if (!memberId) return null;

  const { data: teams } = api.team.getByMember.useQuery(
    { memberId },
    {
      enabled: !!memberId,
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60 * 2, // 2 hours
      retry: 3,
    },
  );
  const { data: tournaments } = api.tournament.getAll.useQuery(undefined, {
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 3,
  });
  const { data: tiers } = api.tier.getAll.useQuery(undefined, {
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2, // 2 hours
    retry: 3,
  });

  // Memoize the filtered and processed winning teams
  const winningTeamsData = useMemo(() => {
    let filteredTeams = teams?.filter(
      (t) => t.position?.replace("T", "") === "1",
    );

    // Filter by seasonId if provided
    if (seasonId) {
      filteredTeams = filteredTeams?.filter((t) => {
        const tourney = tournaments?.find(
          (tournament) => tournament.id === t.tournamentId,
        );
        return tourney?.seasonId === seasonId;
      });
    }
    const winningTeams = filteredTeams
      ?.map((t) => {
        const tourney = tournaments?.find(
          (tournament) => tournament.id === t.tournamentId,
        );
        const tier = tiers?.find((tier) => tier.id === tourney?.tierId);
        return {
          ...t,
          tourney,
          tier,
        };
      })
      .filter((team) => {
        const { tourney, tier } = team;
        // Only show Major tournaments, Canadian Open, or TOUR Championship
        return (
          tourney &&
          (tier?.name === "Major" ||
            tourney.name === "Canadian Open" ||
            tourney.name === "RBC Canadian Open" ||
            tourney.name === "TOUR Championship")
        );
      })
      .sort((a, b) => (b.tier?.payouts[0] ?? 0) - (a.tier?.payouts[0] ?? 0));

    return {
      winningTeams,
      showSeasonText: seasonId === undefined,
      isLargeSize: seasonId !== undefined,
    };
  }, [teams, tournaments, tiers, seasonId]);

  const { winningTeams, showSeasonText, isLargeSize } = winningTeamsData;

  if (
    !teams ||
    !tournaments ||
    !tiers ||
    !winningTeams ||
    winningTeams.length === 0
  )
    return null;
  return (
    <div className="flex flex-row">
      {winningTeams.map((team) => {
        const { tourney } = team;
        if (!tourney) return null;
        return (
          <div
            key={team.id}
            className="flex flex-col items-center justify-center"
          >
            <Image
              src={
                tourney.name === "RBC Canadian Open" ||
                tourney.name === "Canadian Open"
                  ? "https://jn9n1jxo7g.ufs.sh/f/3f3580a5-8a7f-4bc3-a16c-53188869acb2-x8pl2f.png"
                  : tourney.name === "TOUR Championship"
                    ? "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC"
                    : (tourney.logoUrl ?? "")
              }
              alt={`${tourney.name} Championship Logo`}
              width={isLargeSize ? 192 : 128}
              height={isLargeSize ? 192 : 128}
              className={cn(
                "mx-0.5 inline-block",
                isLargeSize
                  ? tourney.name === "TOUR Championship"
                    ? "h-8 w-8"
                    : "h-6 w-6"
                  : tourney.name === "TOUR Championship"
                    ? "h-8 w-8"
                    : "h-6 w-6",
              )}
            />
            {showSeasonText && (
              <span
                className={cn(
                  "font-semibold text-slate-800",
                  isLargeSize
                    ? tourney.name === "TOUR Championship"
                      ? "text-sm"
                      : "text-xs"
                    : tourney.name === "TOUR Championship"
                      ? "text-xs"
                      : "text-2xs",
                )}
              >
                {tourney.startDate instanceof Date
                  ? tourney.startDate.getFullYear()
                  : new Date(tourney.startDate).getFullYear()}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
