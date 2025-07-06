/**
 * Query Configuration Utilities
 *
 * Provides optimized query configurations for different data volatility patterns.
 * These utilities help manage caching, refetching, and performance optimization
 * for React Query and similar data fetching libraries.
 *
 * @fileoverview Query optimization and configuration utilities
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Query configuration interface
 * Defines all possible query optimization options
 */
export interface QueryConfig {
  staleTime: number;
  gcTime: number;
  refetchInterval?: number;
  refetchIntervalInBackground?: boolean;
  refetchOnWindowFocus?: boolean;
  retry: number;
}

/**
 * Query frequency types
 * Defines different data update patterns
 */
export type QueryFrequency = "high" | "medium" | "low" | "static";

/**
 * Query context types
 * Defines different usage contexts for optimization
 */
export type QueryContext =
  | "tournament"
  | "leaderboard"
  | "stats"
  | "background";

// ============================================================================
// CORE CONFIGURATION FUNCTIONS
// ============================================================================

/**
 * Optimized query configuration based on data volatility
 * Provides different caching strategies for high-frequency vs static data
 *
 * @param isHighFrequency Whether the data changes frequently
 * @param customOptions Additional options to override defaults
 * @returns Optimized query configuration
 */
export function getOptimizedQueryConfig(
  isHighFrequency: boolean,
  customOptions?: Partial<QueryConfig>,
): QueryConfig {
  const baseConfig = isHighFrequency
    ? {
        // High-frequency data: frequent updates (live tournaments, leaderboards)
        staleTime: 1000 * 60 * 1, // 1 minute
        gcTime: 1000 * 60 * 5, // 5 minutes
        refetchInterval: 1000 * 60 * 2, // 2 minutes
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: true,
        retry: 3,
      }
    : {
        // Static data: cache longer (historical data, completed tournaments)
        staleTime: 1000 * 60 * 30, // 30 minutes
        gcTime: 1000 * 60 * 60, // 1 hour
        retry: 2,
      };

  return { ...baseConfig, ...customOptions };
}

/**
 * Advanced query configuration with frequency levels
 * Provides more granular control over caching strategies
 *
 * @param frequency Data update frequency level
 * @param customOptions Additional options to override defaults
 * @returns Frequency-optimized query configuration
 */
export function getFrequencyBasedQueryConfig(
  frequency: QueryFrequency,
  customOptions?: Partial<QueryConfig>,
): QueryConfig {
  const configs: Record<QueryFrequency, QueryConfig> = {
    // Real-time data (live leaderboards, current tournament)
    high: {
      staleTime: 1000 * 30, // 30 seconds
      gcTime: 1000 * 60 * 2, // 2 minutes
      refetchInterval: 1000 * 60, // 1 minute
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      retry: 3,
    },

    // Moderate updates (tournament results, team data)
    medium: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 15, // 15 minutes
      refetchInterval: 1000 * 60 * 10, // 10 minutes
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: true,
      retry: 2,
    },

    // Infrequent updates (seasonal data, member profiles)
    low: {
      staleTime: 1000 * 60 * 30, // 30 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false,
      retry: 2,
    },

    // Static data (course info, historical data)
    static: {
      staleTime: 1000 * 60 * 60 * 24, // 24 hours
      gcTime: 1000 * 60 * 60 * 24 * 7, // 1 week
      refetchOnWindowFocus: false,
      retry: 1,
    },
  };

  return { ...configs[frequency], ...customOptions };
}

/**
 * Context-aware query configuration
 * Provides configurations optimized for specific use cases
 *
 * @param context The usage context for the query
 * @param customOptions Additional options to override defaults
 * @returns Context-optimized query configuration
 */
export function getContextBasedQueryConfig(
  context: QueryContext,
  customOptions?: Partial<QueryConfig>,
): QueryConfig {
  const configs: Record<QueryContext, QueryConfig> = {
    // Active tournament data
    tournament: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      refetchInterval: 1000 * 60 * 3, // 3 minutes
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      retry: 3,
    },

    // Live leaderboard data
    leaderboard: {
      staleTime: 1000 * 30, // 30 seconds
      gcTime: 1000 * 60 * 5, // 5 minutes
      refetchInterval: 1000 * 60, // 1 minute
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
      retry: 4,
    },

    // Statistics and analytics
    stats: {
      staleTime: 1000 * 60 * 15, // 15 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false,
      retry: 2,
    },

    // Background processes
    background: {
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60 * 6, // 6 hours
      refetchOnWindowFocus: false,
      retry: 1,
    },
  };

  return { ...configs[context], ...customOptions };
}

// ============================================================================
// SPECIALIZED CONFIGURATION FUNCTIONS
// ============================================================================

/**
 * Tournament status-aware query configuration
 * Adjusts caching based on tournament state
 *
 * @param tournamentStatus Current tournament status
 * @param customOptions Additional options to override defaults
 * @returns Status-optimized query configuration
 */
export function getTournamentStatusQueryConfig(
  tournamentStatus: "upcoming" | "current" | "completed",
  customOptions?: Partial<QueryConfig>,
): QueryConfig {
  switch (tournamentStatus) {
    case "current":
      return getContextBasedQueryConfig("tournament", customOptions);
    case "upcoming":
      return getFrequencyBasedQueryConfig("low", customOptions);
    case "completed":
      return getFrequencyBasedQueryConfig("static", customOptions);
    default:
      return getFrequencyBasedQueryConfig("medium", customOptions);
  }
}

/**
 * Performance-optimized query configuration
 * Reduces query frequency for performance-sensitive contexts
 *
 * @param customOptions Additional options to override defaults
 * @returns Performance-optimized query configuration
 */
export function getPerformanceOptimizedQueryConfig(
  customOptions?: Partial<QueryConfig>,
): QueryConfig {
  return {
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchInterval: 1000 * 60 * 15, // 15 minutes
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: 1,
    ...customOptions,
  };
}

/**
 * Development-friendly query configuration
 * More aggressive refetching for development and testing
 *
 * @param customOptions Additional options to override defaults
 * @returns Development-optimized query configuration
 */
export function getDevelopmentQueryConfig(
  customOptions?: Partial<QueryConfig>,
): QueryConfig {
  return {
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60, // 1 minute
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 1,
    ...customOptions,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Creates a query configuration based on multiple factors
 * Combines frequency, context, and custom options intelligently
 *
 * @param options Configuration options
 * @returns Combined query configuration
 */
export function createQueryConfig(options: {
  frequency?: QueryFrequency;
  context?: QueryContext;
  tournamentStatus?: "upcoming" | "current" | "completed";
  performance?: boolean;
  development?: boolean;
  custom?: Partial<QueryConfig>;
}): QueryConfig {
  const {
    frequency,
    context,
    tournamentStatus,
    performance,
    development,
    custom,
  } = options;

  // Start with base configuration
  let config: QueryConfig;

  if (development) {
    config = getDevelopmentQueryConfig();
  } else if (performance) {
    config = getPerformanceOptimizedQueryConfig();
  } else if (tournamentStatus) {
    config = getTournamentStatusQueryConfig(tournamentStatus);
  } else if (context) {
    config = getContextBasedQueryConfig(context);
  } else if (frequency) {
    config = getFrequencyBasedQueryConfig(frequency);
  } else {
    // Default to medium frequency
    config = getFrequencyBasedQueryConfig("medium");
  }

  // Apply custom overrides
  return { ...config, ...custom };
}

/**
 * Validates query configuration values
 * Ensures configuration values are within reasonable bounds
 *
 * @param config Query configuration to validate
 * @returns Validated and corrected configuration
 */
export function validateQueryConfig(config: QueryConfig): QueryConfig {
  return {
    ...config,
    staleTime: Math.max(0, Math.min(config.staleTime, 1000 * 60 * 60 * 24)), // Max 24 hours
    gcTime: Math.max(
      config.staleTime,
      Math.min(config.gcTime, 1000 * 60 * 60 * 24 * 7),
    ), // Max 1 week
    retry: Math.max(0, Math.min(config.retry, 5)), // Max 5 retries
    ...(config.refetchInterval && {
      refetchInterval: Math.max(1000 * 10, config.refetchInterval), // Min 10 seconds
    }),
  };
}
