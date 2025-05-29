import { ExtendedMember } from "./types";
import type { Team, Tournament } from "@prisma/client";

/**
 * Calculate statistics for a member
 * @param member - Member data with teams and tour cards
 * @param showAdjusted - Whether to use adjusted earnings/points
 * @param tournaments - All tournaments data to find TOUR Championship
 */
export function calculateMemberStats(
  member: ExtendedMember,
  showAdjusted: boolean,
  tournaments?: Tournament[],
) {
  // Get all teams for the member
  const teams = member.teams ?? [];

  // Total appearances (tournaments played)
  const seasons = member.tourCards?.length ?? 0;
  const appearances = member.teams?.length ?? 0;

  // Calculate attendance rate: tournaments played / total tournaments available in their seasons
  // This would require more data than we currently have, so we'll skip for now

  // Cuts made (position is not "CUT")
  const cutsMade = teams.filter((team) => team.position !== "CUT").length;
  const cutsPercent = appearances > 0 ? (cutsMade / appearances) * 100 : 0;

  // Top 10 finishes (position is 10 or better, excluding "T" positions after 10)
  const top10s = teams.filter((team) => {
    if (team.position === "CUT") return false;

    // Handle positions like "1", "T1", etc.
    if (!team.position) return false;
    const positionNum = parseInt(team.position.replace("T", ""), 10);
    return !isNaN(positionNum) && positionNum <= 10;
  }).length;

  // Top 5 finishes
  const top5s = teams.filter((team) => {
    if (team.position === "CUT") return false;
    // Handle positions like "1", "T1", etc.
    if (!team.position) return false;
    const positionNum = parseInt(team.position.replace("T", ""), 10);
    return !isNaN(positionNum) && positionNum <= 5;
  }).length;

  // Wins (position "1" or "T1")
  const wins = teams.filter(
    (team) => team.position === "1" || team.position === "T1",
  ).length;

  // Total earnings
  const earnings = (member.tourCards ?? []).reduce(
    (p, c) =>
      (p += showAdjusted ? (c.adjustedEarnings ?? c.earnings) : c.earnings),
    0,
  );

  // Total points
  const points = (member.tourCards ?? []).reduce(
    (p, c) =>
      (p += showAdjusted
        ? (c.adjustedPoints ?? c.points ?? 0)
        : (c.points ?? 0)),
    0,
  );

  // Average finish position (excluding CUT)
  const nonCutTeams = teams.filter((team) => team.position !== "CUT");
  const avgFinish = calculateAveragePosition(nonCutTeams);

  // 2024 TOUR Championship finish
  let tourChampionshipFinish = null;

  if (tournaments && tournaments.length > 0) {
    // Find the 2024 TOUR Championship tournament
    const tourChampionship = tournaments.find(
      (t) =>
        t.name === "TOUR Championship" &&
        new Date(t.startDate).getFullYear() === 2024,
    );

    if (tourChampionship) {
      // Find the team for this member in the TOUR Championship
      const teamEntry = teams.find(
        (team) => team.tournamentId === tourChampionship.id,
      );

      if (teamEntry) {
        tourChampionshipFinish = teamEntry.position;
      }
    }
  }

  return {
    seasons,
    appearances,
    cutsMade,
    cutsPercent,
    top10s,
    top5s,
    wins,
    earnings,
    points,
    avgFinish,
    tourChampionshipFinish,
  };
}

/**
 * Calculate average position from an array of teams
 * @param teams - Teams with position data
 */
function calculateAveragePosition(teams: Team[]): number {
  if (teams.length === 0) return 0;

  const totalPosition = teams.reduce((sum, team) => {
    // Extract numeric position (e.g., "T5" -> 5)
    if (!team.position) return sum;
    const positionNum = parseInt(team.position.replace("T", ""), 10);
    return !isNaN(positionNum) ? sum + positionNum : sum;
  }, 0);

  return totalPosition / teams.length;
}
