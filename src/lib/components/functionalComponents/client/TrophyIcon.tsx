"use client";

import Image from "next/image";
import { cn, isDate } from "@/lib/utils/core/types";
import { Tournament } from "@prisma/client";

// Use Pick for minimal Tournament type in ChampionTrophyTeam
export interface ChampionTrophyTeam {
  id: string;
  tournament?: Pick<Tournament, "name" | "logoUrl" | "startDate"> | null;
}

interface TrophyIconProps {
  team: ChampionTrophyTeam;
  showSeasonText: boolean;
  isLargeSize: boolean;
}

export function TrophyIcon({
  team,
  showSeasonText,
  isLargeSize,
}: TrophyIconProps) {
  const tournament = team.tournament;
  if (!tournament) return null;

  const isTourChamp = tournament.name === "TOUR Championship";
  const isCanadianOpen =
    tournament.name === "RBC Canadian Open" ||
    tournament.name === "Canadian Open";
  const logoUrl = isCanadianOpen
    ? "https://jn9n1jxo7g.ufs.sh/f/3f3580a5-8a7f-4bc3-a16c-53188869acb2-x8pl2f.png"
    : isTourChamp
      ? "https://jn9n1jxo7g.ufs.sh/f/94GU8p0EVxqPNsO8w6FZhY1BamONzvl3bLgdn0IXVM8fEoTC"
      : (tournament.logoUrl ?? "");

  const imgClass = cn(
    "inline-block",
    isCanadianOpen
      ? "h-6 w-6 p-0.5 mx-0"
      : isTourChamp
        ? "h-8 w-8 mx-0.5"
        : "h-6 w-6 mx-0.5",
  );

  const textClass = cn(
    "font-semibold text-slate-800",
    isLargeSize
      ? isTourChamp
        ? "text-sm"
        : "text-xs"
      : isTourChamp
        ? "text-xs"
        : "text-2xs",
  );

  const year = isDate(tournament.startDate)
    ? (tournament.startDate as Date).getFullYear()
    : new Date(tournament.startDate).getFullYear();

  return (
    <div className="flex flex-col items-center justify-center" key={team.id}>
      <Image
        src={logoUrl}
        alt={`${tournament.name} Championship Logo`}
        width={isLargeSize ? 192 : 128}
        height={isLargeSize ? 192 : 128}
        className={imgClass}
      />
      {showSeasonText && <span className={textClass}>{year}</span>}
    </div>
  );
}
