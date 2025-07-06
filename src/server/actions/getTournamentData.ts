import type {
  MinimalTournament,
  EnhancedTournamentHookResult,
} from "@/lib/types";
import { api } from "@/trpc/server";
import * as tournamentUtils from "@/lib/utils/domain/tournaments";

export async function getTournamentData(
  seasonId: string,
): Promise<EnhancedTournamentHookResult> {
  const now = new Date();
  const tournaments = await api.tournament.getBySeason({ seasonId });

  const current = tournamentUtils.getCurrentTournament(tournaments);
  const upcoming = tournamentUtils.getUpcoming(tournaments);
  const completed = tournamentUtils.getCompleted(tournaments);
  const next = upcoming.length > 0 ? upcoming[0] : null;
  const previous = completed.length > 0 ? completed[0] : null;

  const stats = {
    total: tournaments.length,
    currentCount: current ? 1 : 0,
    upcomingCount: upcoming.length,
    completedCount: completed.length,
  };

  const utils = {
    isLive: (tournament: MinimalTournament): boolean =>
      tournamentUtils.isLive(tournament),
    getByStatus: (
      status: "upcoming" | "current" | "completed",
    ): MinimalTournament[] => tournamentUtils.getByStatus(tournaments, status),
    sortBy: (
      field: keyof MinimalTournament,
      direction: "asc" | "desc" = "asc",
      arr: MinimalTournament[] = tournaments,
    ): MinimalTournament[] =>
      tournamentUtils.sortTournaments(arr, field, direction),
  };

  const meta = {
    lastUpdated: now,
    dataSource: "server" as const,
    cacheHit: false,
  };

  return {
    current: current ?? null,
    next: next ?? null,
    previous: previous ?? null,
    upcoming: upcoming ?? null,
    completed: completed ?? null,
    all: tournaments,
    season: null, // Optionally fetch season info if needed
    isLoading: false,
    error: null,
    stats,
    utils,
    meta,
  };
}
