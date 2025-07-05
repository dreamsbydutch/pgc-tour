/**
 * System caching utilities
 * Optimized cache configuration for golf tournament data with cost-conscious settings
 */

export interface CacheConfig {
  staleTime: number;
  gcTime: number;
  refetchInterval?: number;
  refetchIntervalInBackground?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  refetchOnReconnect?: boolean;
  retry?: number | boolean;
  retryDelay?: number;
}

export interface DataType {
  type: "live" | "recent" | "historical" | "static" | "user-specific";
  priority: "high" | "medium" | "low";
  changeFrequency: "frequent" | "moderate" | "rare" | "never";
}

/**
 * Tournament status affects how aggressively we cache and refresh data
 */
export type TournamentStatus = "upcoming" | "current" | "recent" | "historical";

/**
 * Cost-optimized caching presets for different data types
 * Balances data freshness with server/database cost reduction
 */
const CACHE_PRESETS = {
  // Live tournament data (during play)
  LIVE_TOURNAMENT: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 3 * 60 * 1000, // 3 minutes
    refetchIntervalInBackground: false, // Cost savings: no background polling
    refetchOnWindowFocus: true, // Only when user is actively viewing
    refetchOnMount: false, // Use cached data on mount
    refetchOnReconnect: true, // Refresh on reconnect
    retry: 2, // Reduced retries to save costs
    retryDelay: 5000,
  },

  // Recent tournament (last 24 hours, scores might still change)
  RECENT_TOURNAMENT: {
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: true,
    refetchOnMount: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 3000,
  },

  // Historical tournament (scores finalized, very stable)
  HISTORICAL_TOURNAMENT: {
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    refetchOnWindowFocus: false, // No need to refresh historical data
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1, // Minimal retries for stable data
    retryDelay: 1000,
  },

  // User-specific data (member profiles, tour cards)
  USER_DATA: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false, // Don't refresh user data on focus
    refetchOnMount: false,
    refetchOnReconnect: true, // User might have updated profile elsewhere
    retry: 2,
    retryDelay: 2000,
  },

  // Static/reference data (courses, tiers, rules)
  STATIC_DATA: {
    staleTime: 4 * 60 * 60 * 1000, // 4 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000,
  },

  // Navigation/menu data
  NAVIGATION_DATA: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    retry: 1,
    retryDelay: 1000,
  },

  // Default for unknown data types
  DEFAULT: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 2000,
  },
} as const satisfies Record<string, CacheConfig>;

/**
 * Get optimized cache configuration based on tournament status and data type
 * Central function for determining cache behavior across the app
 */
export function getCacheConfig(
  tournamentStatus: TournamentStatus,
  dataType: DataType["type"] = "historical",
  options?: Partial<CacheConfig>,
): CacheConfig {
  let baseConfig: CacheConfig;

  // Determine base configuration based on data characteristics
  if (dataType === "static") {
    baseConfig = CACHE_PRESETS.STATIC_DATA;
  } else if (dataType === "user-specific") {
    baseConfig = CACHE_PRESETS.USER_DATA;
  } else if (tournamentStatus === "current" && dataType === "live") {
    baseConfig = CACHE_PRESETS.LIVE_TOURNAMENT;
  } else if (tournamentStatus === "recent") {
    baseConfig = CACHE_PRESETS.RECENT_TOURNAMENT;
  } else if (
    tournamentStatus === "historical" ||
    tournamentStatus === "upcoming"
  ) {
    baseConfig = CACHE_PRESETS.HISTORICAL_TOURNAMENT;
  } else {
    baseConfig = CACHE_PRESETS.DEFAULT;
  }

  // Apply any custom overrides
  return { ...baseConfig, ...options };
}

/**
 * Special polling configuration with user-controlled intervals
 * Allows users to opt into more frequent updates for live tournaments
 */
export function getPollingConfig(
  isLive: boolean,
  userPreference: "conservative" | "standard" | "aggressive" = "standard",
): Partial<CacheConfig> {
  if (!isLive) {
    return {
      refetchInterval: undefined,
      refetchIntervalInBackground: false,
    };
  }

  const intervals = {
    conservative: 5 * 60 * 1000, // 5 minutes
    standard: 3 * 60 * 1000, // 3 minutes
    aggressive: 90 * 1000, // 1.5 minutes
  };

  return {
    refetchInterval: intervals[userPreference],
    refetchIntervalInBackground: false, // Always disabled for cost savings
    staleTime: Math.floor(intervals[userPreference] / 2),
  };
}

/**
 * Smart refresh strategy that considers user engagement
 * Only refreshes when user is active and data is live
 */
export function getSmartRefreshConfig(
  isUserActive: boolean,
  isLiveData: boolean,
): Partial<CacheConfig> {
  return {
    refetchOnWindowFocus: isLiveData && isUserActive,
    refetchIntervalInBackground: false, // Never poll in background
    refetchInterval: isLiveData && isUserActive ? 3 * 60 * 1000 : undefined,
  };
}

/**
 * Cache key constants for consistent naming across the app
 */
export const CACHE_TAGS = {
  CURRENT_TOURNAMENT: "current-tournament",
  TOURNAMENT_PREFIX: "tournament-",
  MEMBER_PREFIX: "member-",
  TOUR_CARD_PREFIX: "tour-card-",
  LEADERBOARD: "leaderboard",
  USER_PROFILE: "user-profile",
  NAVIGATION: "navigation",
} as const;

/**
 * Creates standardized cache keys
 * Ensures consistent cache key naming throughout the application
 */
export function createCacheKey(
  type: keyof typeof CACHE_TAGS,
  id?: string,
): string {
  return id ? `${CACHE_TAGS[type]}${id}` : CACHE_TAGS[type];
}

/**
 * Development cache monitoring
 * Tracks query frequency for performance analysis
 */
export function logCacheStats(
  queryKey: string,
  action: "hit" | "miss" | "fetch",
): void {
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Cache ${action.toUpperCase()}] ${queryKey} at ${new Date().toISOString()}`,
    );
  }
}

/**
 * Cache warming configuration for preloading critical data
 * Used for frequently accessed data that should be ready immediately
 */
export function getCacheWarmingConfig(): CacheConfig {
  return {
    staleTime: 1000, // Very short stale time to force refresh
    gcTime: 5 * 60 * 1000, // Keep for 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000,
  };
}

/**
 * Emergency cache busting configuration
 * For when data needs immediate refresh (e.g., after critical updates)
 */
export function getEmergencyRefreshConfig(): CacheConfig {
  return {
    staleTime: 0, // Immediate refresh
    gcTime: 1000, // Minimal garbage collection
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: 1000,
  };
}

/**
 * In-memory cache implementation for simple data
 * Lightweight alternative to complex caching libraries
 */
export class SimpleCache<T> {
  private cache = new Map<
    string,
    { data: T; timestamp: number; ttl: number }
  >();

  set(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  size(): number {
    return this.cache.size;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}
