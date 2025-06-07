import { useMainStore } from "./store";
import { initializeLeaderboard } from "./leaderboard";

// API data types that may not match full Prisma types
interface _ApiTournament {
  id: string;
  startDate: string | Date;
  endDate: string | Date;
  currentRound?: number;
  [key: string]: unknown;
}

interface CacheRefreshResult {
  success: boolean;
  reason: string;
  dataTypes?: string[];
}

interface CacheOptions {
  force?: boolean;
  source?: string;
  types?: ("tournaments" | "tourCards" | "all")[];
}

const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

class CacheManager {
  private async fetchWithTimeout<T>(url: string, timeout = 10000): Promise<T | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache" },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`❌ ${url} failed: ${response.status}`);
        return null;
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error(`💥 ${url} error:`, error);
      return null;
    }
  }

  private async checkDatabaseInvalidation(): Promise<{
    needsTournaments: boolean;
    needsTourCards: boolean;
  }> {
    const response = await this.fetchWithTimeout<{
      latestTournamentInvalidation: { timestamp: number } | null;
      latestTourCardInvalidation: { timestamp: number } | null;
    }>("/api/cache/invalidate");

    if (!response) {
      return { needsTournaments: false, needsTourCards: false };
    }

    const storeTimestamp = useMainStore.getState()._lastUpdated ?? 0;
    
    return {
      needsTournaments: (response.latestTournamentInvalidation?.timestamp ?? 0) > storeTimestamp,
      needsTourCards: (response.latestTourCardInvalidation?.timestamp ?? 0) > storeTimestamp,
    };
  }

  private async refreshTournaments(): Promise<boolean> {
    const data = await this.fetchWithTimeout<{
      tournaments: Array<{
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        currentRound: number | null;
        course: { name: string } | null;
        [key: string]: unknown;
      }>;
    }>("/api/tournaments/all");

    if (!data?.tournaments) return false;

    const now = new Date();
    const tournaments = data.tournaments
      .map(t => ({
        ...t,
        startDate: new Date(t.startDate),
        endDate: new Date(t.endDate),
      }))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    const currentTournament = tournaments.find(
      t => t.startDate <= now && t.endDate >= now && (t.currentRound ?? 0) < 5
    ) ?? null;

    const nextTournament = tournaments.find(t => t.startDate > now) ?? null;

    useMainStore.setState(state => ({
      ...state,
      seasonTournaments: tournaments as unknown as typeof state.seasonTournaments, // Cast API data to expected tournament type
      currentTournament: currentTournament as unknown as typeof state.currentTournament,
      nextTournament: nextTournament as unknown as typeof state.nextTournament,
      _lastUpdated: Date.now(),
    }));

    // Initialize leaderboard if current tournament exists
    if (currentTournament) {
      await initializeLeaderboard(parseInt(currentTournament.id)).catch(console.error);
    }

    return true;
  }

  private async refreshTourCards(): Promise<boolean> {
    const data = await this.fetchWithTimeout<{
      tourCards: TourCard[];
    }>("/api/tourcards/current");

    if (!data?.tourCards) return false;

    useMainStore.setState(state => ({
      ...state,
      tourCards: data.tourCards as unknown as typeof state.tourCards, // API data may not have all Prisma fields
      _lastUpdated: Date.now(),
    }));

    return true;
  }

  async checkAndRefresh(options: CacheOptions = {}): Promise<CacheRefreshResult> {
    const { force = false, source: _source = "auto" } = options;
    const store = useMainStore.getState();
    
    // Check if cache is fresh enough (unless forced)
    if (!force && store._lastUpdated) {
      const age = Date.now() - store._lastUpdated;
      if (age < CACHE_EXPIRY) {
        return { success: false, reason: "Cache is fresh" };
      }
    }

    let needsTournaments = force;
    let needsTourCards = force;

    // Check database flags unless forced
    if (!force) {
      const invalidation = await this.checkDatabaseInvalidation();
      needsTournaments = invalidation.needsTournaments;
      needsTourCards = invalidation.needsTourCards;
    }

    if (!needsTournaments && !needsTourCards) {
      return { success: false, reason: "No refresh needed" };
    }

    const results: string[] = [];
    let success = true;

    if (needsTournaments) {
      const tournamentSuccess = await this.refreshTournaments();
      if (tournamentSuccess) {
        results.push("tournaments");
      } else {
        success = false;
      }
    }

    if (needsTourCards) {
      const tourCardSuccess = await this.refreshTourCards();
      if (tourCardSuccess) {
        results.push("tourCards");
      } else {
        success = false;
      }
    }

    return {
      success,
      reason: success ? `Refreshed: ${results.join(", ")}` : "Some refreshes failed",
      dataTypes: results,
    };
  }

  async invalidateAndRefresh(type: "tournaments" | "tourCards" | "all" = "all"): Promise<boolean> {
    try {
      // Trigger database invalidation
      await fetch("/api/cache/invalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "manual", type }),
      });

      // Force refresh
      const result = await this.checkAndRefresh({ force: true });
      return result.success;
    } catch (error) {
      console.error("Cache invalidation failed:", error);
      return false;
    }
  }
}

export const cacheManager = new CacheManager();

// Simplified exports for backward compatibility
export const checkAndRefreshIfNeeded = (options?: CacheOptions) => 
  cacheManager.checkAndRefresh(options);

export const forceRefreshCache = (type?: "tournaments" | "tourCards" | "all" | "global") =>
  cacheManager.invalidateAndRefresh(type === "global" ? "all" : type);

export const refreshWithMiddlewareCoordination = () =>
  cacheManager.checkAndRefresh({ source: "middleware" });

interface TourCard {
  id: string;
  [key: string]: unknown;
}
