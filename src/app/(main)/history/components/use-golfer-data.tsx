import { useMemo } from "react";

interface RawGolferData {
  playerName: string;
  group: number | null;
  position: string | null;
  worldRank: number | null;
  usage: number | null;
}

interface ProcessedGolfer {
  name: string;
  apps: number;
  wins: number;
  top5s: number;
  top10s: number;
  cutsMade: number;
  avgUsage: number | null;
  groupCounts: Record<number, number>;
  lowGroup: number | null;
  highGroup: number | null;
  averageWorldRanking: number | null;
  groupOne: number | null;
  groupTwo: number | null;
  groupThree: number | null;
  groupFour: number | null;
  groupFive: number | null;
}

function parsePosition(position: string | null): number | null {
  if (!position || position === "CUT") return null;
  const cleaned = position.replace("T", "");
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? null : parsed;
}

function isWin(position: string | null): boolean {
  return position === "1";
}

function isTop5(position: string | null): boolean {
  const pos = parsePosition(position);
  return pos !== null && pos <= 5;
}

function isTop10(position: string | null): boolean {
  const pos = parsePosition(position);
  return pos !== null && pos <= 10;
}

function isCutMade(position: string | null): boolean {
  return position !== "CUT";
}

function calculateGroupStats(appearances: RawGolferData[]): {
  groupCounts: Record<number, number>;
  lowGroup: number | null;
  highGroup: number | null;
} {
  const groupCounts: Record<number, number> = {};
  let lowGroup = Infinity;
  let highGroup = -Infinity;

  appearances.forEach(({ group }) => {
    if (group !== null) {
      groupCounts[group] = (groupCounts[group] || 0) + 1;
      lowGroup = Math.min(lowGroup, group);
      highGroup = Math.max(highGroup, group);
    }
  });

  return {
    groupCounts,
    lowGroup: lowGroup === Infinity ? null : lowGroup,
    highGroup: highGroup === -Infinity ? null : highGroup,
  };
}

function calculateAverage(
  appearances: RawGolferData[],
  getValue: (app: RawGolferData) => number | null,
  multiplier = 1,
): number | null {
  if (appearances.length === 0) return null;

  const validValues = appearances
    .map(getValue)
    .filter((value): value is number => value !== null);

  if (validValues.length === 0) return null;

  const sum = validValues.reduce(
    (total, value) => total + value * multiplier,
    0,
  );
  return sum / validValues.length;
}

function calculateGroupPercentages(
  groupCounts: Record<number, number>,
  totalApps: number,
): Record<string, number | null> {
  if (totalApps === 0) {
    return {
      groupOne: null,
      groupTwo: null,
      groupThree: null,
      groupFour: null,
      groupFive: null,
    };
  }

  return {
    groupOne: ((groupCounts[1] ?? 0) / totalApps) * 100,
    groupTwo: ((groupCounts[2] ?? 0) / totalApps) * 100,
    groupThree: ((groupCounts[3] ?? 0) / totalApps) * 100,
    groupFour: ((groupCounts[4] ?? 0) / totalApps) * 100,
    groupFive: ((groupCounts[5] ?? 0) / totalApps) * 100,
  };
}

function processGolferData(
  golferName: string,
  golfersData: RawGolferData[],
): ProcessedGolfer {
  const appearances = golfersData.filter(
    (g) => g.playerName === golferName && (g.group ?? 0) > 0,
  );

  const wins = appearances.filter((g) => isWin(g.position));
  const top5s = appearances.filter((g) => isTop5(g.position));
  const top10s = appearances.filter((g) => isTop10(g.position));
  const cutsMade = appearances.filter((g) => isCutMade(g.position));

  const { groupCounts, lowGroup, highGroup } = calculateGroupStats(appearances);

  const avgWorldRanking = calculateAverage(appearances, (app) => app.worldRank);

  const avgUsage = calculateAverage(
    appearances,
    (app) => app.usage,
    100, // Convert to percentage
  );

  const totalApps = appearances.length;
  const groupPercentages = calculateGroupPercentages(groupCounts, totalApps);

  return {
    name: golferName,
    apps: totalApps,
    wins: wins.length,
    top5s: top5s.length,
    top10s: top10s.length,
    cutsMade: cutsMade.length,
    avgUsage,
    groupCounts,
    lowGroup,
    highGroup,
    averageWorldRanking: avgWorldRanking,
    groupOne: groupPercentages.groupOne,
    groupTwo: groupPercentages.groupTwo,
    groupThree: groupPercentages.groupThree,
    groupFour: groupPercentages.groupFour,
    groupFive: groupPercentages.groupFive,
  };
}

export function useGolferData(
  golfersData: RawGolferData[] | undefined,
): ProcessedGolfer[] {
  return useMemo(() => {
    if (!golfersData) return [];

    // Get unique golfer names who have participated in groups
    const uniqueGolfers = [
      ...new Set(
        golfersData.filter((g) => (g.group ?? 0) > 0).map((g) => g.playerName),
      ),
    ];

    // Process each golfer's data
    return uniqueGolfers.map((golferName) =>
      processGolferData(golferName, golfersData),
    );
  }, [golfersData]);
}
