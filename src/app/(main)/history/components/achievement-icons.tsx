"use client";

import Image from "next/image";
import { useMemo } from "react";
import { cn } from "@/src/lib/utils";
import type { Member, Team, Tier, Tournament } from "@prisma/client";
import { ExtendedTourCard } from "./types";

interface AchievementIconsProps {
  teams: Team[];
  tiers: Tier[];
  tournaments: Tournament[];
  tourCards: (ExtendedTourCard & { member: Member | undefined })[] | undefined;
}

/**
 * Achievements Component
 * Displays achievement icons for major tournament wins and championships
 */
export function AchievementIcons({
  teams,
  tiers,
  tournaments,
  tourCards,
}: AchievementIconsProps) {
  // Filter eligible teams (winners of major/special tournaments) with memoization
  const sortedTeams = useMemo(() => {
    // Filter eligible teams (winners of major/special tournaments)
    const eligibleTeams = teams.filter((team) => {
      const tourney = tournaments.find((t) => t.id === team.tournamentId);
      const tier = tiers.find((t) => t.id === tourney?.tierId);
      const tourCard = tourCards?.find((tc) => tc.id === team.tourCardId);

      return (
        (tier?.name === "Major" ||
          tourney?.name === "RBC Canadian Open" ||
          tourney?.name === "TOUR Championship") &&
        (team.position === "1" || team.position === "T1") &&
        (tourCard?.playoff ?? 0) <= 1
      );
    });

    // Sort teams: TOUR Championship first, then Majors, then others
    return eligibleTeams.sort((a, b) => {
      const tourneyA = tournaments.find((t) => t.id === a.tournamentId);
      const tourneyB = tournaments.find((t) => t.id === b.tournamentId);
      const tierA = tiers.find((t) => t.id === tourneyA?.tierId);
      const tierB = tiers.find((t) => t.id === tourneyB?.tierId);

      // TOUR Championship should be first
      if (tourneyA?.name === "TOUR Championship") return -1;
      if (tourneyB?.name === "TOUR Championship") return 1;

      // Then Majors
      if (tierA?.name === "Major" && tierB?.name !== "Major") return -1;
      if (tierA?.name !== "Major" && tierB?.name === "Major") return 1;

      // Sort by date descending (newer first)
      return (
        new Date(tourneyB?.startDate ?? "").getTime() -
        new Date(tourneyA?.startDate ?? "").getTime()
      );
    });
  }, [teams, tournaments, tiers, tourCards]);

  return (
    <>
      {sortedTeams.map((team) => {
        const tourney = tournaments.find((t) => t.id === team.tournamentId);

        return (
          <div
            key={team.id}
            className="flex flex-col items-center justify-center"
          >
            <Image
              key={team.id + "-img"}
              src={
                tourney?.name === "RBC Canadian Open"
                  ? "https://jn9n1jxo7g.ufs.sh/f/3f3580a5-8a7f-4bc3-a16c-53188869acb2-x8pl2f.png"
                  : tourney?.name === "TOUR Championship"
                    ? "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC"
                    : (tourney?.logoUrl ?? "")
              }
              alt="Tournament Champion Logo"
              width={512}
              height={512}
              className={cn(
                "mx-0.5 inline-block",
                tourney?.name === "TOUR Championship" ? "h-7 w-7" : "h-5 w-5",
              )}
            />
            <div
              className={cn(
                "font-semibold",
                tourney?.name === "TOUR Championship" ? "text-2xs" : "text-3xs",
              )}
            >
              {new Date(tourney?.startDate ?? "").getFullYear()}
            </div>
          </div>
        );
      })}
    </>
  );
}
