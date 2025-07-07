// import { useMemo } from "react";

// interface ProcessedGolferData {
//   name: string;
//   apps: number;
//   wins: number;
//   top5s: number;
//   top10s: number;
//   cutsMade: number;
//   avgUsage: number | null;
//   groupCounts: Record<number, number>;
//   lowGroup: number | null;
//   highGroup: number | null;
//   averageWorldRanking: number | null;
//   groupOne: number | null;
//   groupTwo: number | null;
//   groupThree: number | null;
//   groupFour: number | null;
//   groupFive: number | null;
// }

// interface RawGolferData {
//   playerName: string;
//   group: number | null;
//   position: string | null;
//   worldRank: number | null;
//   usage: number | null;
// }

// export function useGolferData(
//   golfersData: RawGolferData[] | undefined,
// ): ProcessedGolferData[] {
//   return useMemo(() => {
//     if (!golfersData) return [];

//     // Process golfers data into a more usable format
//     return [
//       ...new Set(
//         golfersData.filter((g) => (g.group ?? 0) > 0).map((g) => g.playerName),
//       ),
//     ].map((golfer) => {
//       const apps = golfersData.filter(
//         (g) => g.playerName === golfer && (g.group ?? 0) > 0,
//       );
//       const wins = apps?.filter((g) => g.position === "1");
//       const top5s = apps?.filter((g) => {
//         if (g.position === "CUT") return false;
//         const positionNum = parseInt(g.position?.replace("T", "") ?? "", 10);
//         return !isNaN(positionNum) && positionNum <= 5;
//       });
//       const top10s = apps?.filter((g) => {
//         if (g.position === "CUT") return false;
//         const positionNum = parseInt(g.position?.replace("T", "") ?? "", 10);
//         return !isNaN(positionNum) && positionNum <= 10;
//       });
//       const cutsMade = apps?.filter((g) => g.position !== "CUT");

//       // Find a golfers most frequent group number as well as which group number it is
//       const groups = apps?.map((g) => g.group).filter((g) => g !== null);
//       const groupCounts: Record<number, number> = {};
//       let lowGroup = Infinity;
//       let highGroup = -Infinity;
//       groups?.forEach((group) => {
//         if (group !== null) {
//           groupCounts[group] = (groupCounts[group] || 0) + 1;
//           const groupNum = parseInt(String(group), 10);
//           if (!isNaN(groupNum)) {
//             lowGroup = Math.min(lowGroup, groupNum);
//             highGroup = Math.max(highGroup, groupNum);
//           }
//         }
//       });
//       const avgWorldRanking =
//         apps && apps.length > 0
//           ? apps.reduce((sum, g) => sum + (g.worldRank ?? 0), 0) / apps.length
//           : 0;
//       const avgUsage =
//         apps && apps.length > 0
//           ? apps.reduce((sum, g) => (sum += (g.usage ?? 0) * 100), 0) /
//             apps.length
//           : 0;
//       const totalApps = apps?.length ?? 0;

//       // Calculate group percentages for sorting
//       const groupPercentages = {
//         groupOne:
//           totalApps > 0 ? ((groupCounts[1] ?? 0) / totalApps) * 100 : null,
//         groupTwo:
//           totalApps > 0 ? ((groupCounts[2] ?? 0) / totalApps) * 100 : null,
//         groupThree:
//           totalApps > 0 ? ((groupCounts[3] ?? 0) / totalApps) * 100 : null,
//         groupFour:
//           totalApps > 0 ? ((groupCounts[4] ?? 0) / totalApps) * 100 : null,
//         groupFive:
//           totalApps > 0 ? ((groupCounts[5] ?? 0) / totalApps) * 100 : null,
//       };

//       return {
//         name: golfer,
//         apps: totalApps,
//         wins: wins?.length ?? 0,
//         top5s: top5s?.length ?? 0,
//         top10s: top10s?.length ?? 0,
//         cutsMade: cutsMade?.length ?? 0,
//         avgUsage: isNaN(avgUsage) ? null : avgUsage,
//         groupCounts: groupCounts,
//         lowGroup: lowGroup === Infinity ? null : lowGroup,
//         highGroup: highGroup === -Infinity ? null : highGroup,
//         averageWorldRanking: isNaN(avgWorldRanking) ? null : avgWorldRanking,
//         ...groupPercentages,
//       };
//     });
//   }, [golfersData]);
// }
