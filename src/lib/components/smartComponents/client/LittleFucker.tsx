"use client";

import { isNonEmptyArray } from "@/lib/utils/core/types";
import { useChampionTrophies } from "@/lib/hooks";
import {
  type ChampionTrophyTeam,
  TrophyIcon,
} from "@/lib/components/functionalComponents/client/TrophyIcon";

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
