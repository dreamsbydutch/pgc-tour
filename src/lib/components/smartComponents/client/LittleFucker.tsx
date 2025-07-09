"use client";

import {
  type ChampionTrophyTeam,
  TrophyIcon,
} from "@/lib/components/smartComponents/functionalComponents/client/TrophyIcon";
import { useChampionTrophies } from "@/lib/hooks/hooks";
import { isNonEmptyArray } from "@tanstack/react-form";

interface LittleFuckerProps {
  memberId: string;
  seasonId?: string;
}
export default function LittleFucker({
  memberId,
  seasonId,
}: LittleFuckerProps) {
  
  const { championTrophies, isLoading, showSeasonText, isLargeSize } =
  useChampionTrophies({
    memberId,
    seasonId,
  });
  
  if (!memberId) return null;
  if (isLoading || !isNonEmptyArray(championTrophies)) return null;

  return (
    <div className="flex flex-row">
      {championTrophies.map((team) => (
        <TrophyIcon
          key={team.id}
          team={team as unknown as ChampionTrophyTeam}
          showSeasonText={showSeasonText}
          isLargeSize={isLargeSize}
        />
      ))}
    </div>
  );
}
