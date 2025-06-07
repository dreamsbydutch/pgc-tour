/**
 * History Module Utilities
 * Centralized utility functions for the history module
 */

export * from "./member-stats";
export * from "./team-calculations";
export type { MemberStats } from "./member-stats";

// Additional utility functions for history module
export function formatPercentage(value: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

export function calculateCutPercentage(
  cutsMade: number,
  totalApps: number,
): string {
  return formatPercentage(cutsMade, totalApps);
}

export function formatAverageUsage(usage: number): string {
  return usage.toFixed(1);
}

export function getSeasonRange(seasons: number[]): string {
  if (seasons.length === 0) return "";
  if (seasons.length === 1) return seasons[0]?.toString() ?? "";

  const sortedSeasons = [...seasons].sort((a, b) => a - b);
  return `${sortedSeasons[0]} - ${sortedSeasons[sortedSeasons.length - 1]}`;
}

export function getTournamentDisplayName(tournamentName: string): string {
  // Handle special tournament name formatting
  if (tournamentName === "TOUR Championship") {
    return "TC";
  }
  return tournamentName;
}
