/**
 * Migration utilities for transitioning from old store to new architecture
 */

import { Tournament, UserProfile, Team } from "../types";

// Feature flags for gradual rollout
export const FEATURE_FLAGS = {
  NEW_TOURNAMENT_STORE: process.env.NEXT_PUBLIC_NEW_TOURNAMENT_STORE === "true",
  NEW_LEADERBOARD_STORE:
    process.env.NEXT_PUBLIC_NEW_LEADERBOARD_STORE === "true",
  NEW_USER_STORE: process.env.NEXT_PUBLIC_NEW_USER_STORE === "true",
  NEW_UI_STORE: process.env.NEXT_PUBLIC_NEW_UI_STORE === "true",
} as const;

/**
 * Check if new store architecture should be used
 */
export function useNewStoreArchitecture(): boolean {
  return Object.values(FEATURE_FLAGS).some((flag) => flag);
}

/**
 * Migration helpers for data transformation
 */
export class StoreMigration {
  /**
   * Migrate old tournament data structure to new format
   */
  static migrateTournamentData(oldData: any): Tournament | null {
    if (!oldData) return null;

    try {
      return {
        id: oldData.id || oldData.tournament_id,
        name: oldData.name || oldData.tournament_name,
        status: oldData.status || "upcoming",
        startDate: new Date(oldData.start_date || oldData.startDate),
        endDate: new Date(oldData.end_date || oldData.endDate),
        venue: oldData.venue || oldData.course_name,
        purse: oldData.purse || 0,
        currentRound: oldData.current_round || oldData.currentRound || 1,
        totalRounds: oldData.total_rounds || oldData.totalRounds || 4,
        cutLine: oldData.cut_line || oldData.cutLine,
        isMinorTournament: oldData.is_minor || oldData.isMinor || false,
        course: {
          id: oldData.course?.id || oldData.course_id || "",
          name: oldData.course?.name || oldData.course_name || oldData.venue,
          par: oldData.course?.par || 72,
          yardage: oldData.course?.yardage || 7000,
          holes: oldData.course?.holes || [],
          difficulty: oldData.course?.difficulty || "medium",
        },
        metadata: {
          description: oldData.description || "",
          featuredGroups: oldData.featured_groups || [],
          coverage: oldData.coverage || { tv: [], streaming: [] },
          sponsors: oldData.sponsors || [],
          prizeBreakdown: oldData.prize_breakdown || {},
        },
      };
    } catch (error) {
      console.error("Failed to migrate tournament data:", error);
      return null;
    }
  }

  /**
   * Migrate old user data structure to new format
   */
  static migrateUserData(oldData: any): UserProfile | null {
    if (!oldData) return null;

    try {
      return {
        id: oldData.id || oldData.user_id,
        username: oldData.username || oldData.name,
        email: oldData.email,
        avatar: oldData.avatar || oldData.profile_picture,
        preferences: {
          favoriteGolfers: oldData.favorite_golfers || oldData.favorites || [],
          notifications: {
            leaderboardUpdates: oldData.notifications?.leaderboard ?? true,
            favoriteGolferUpdates: oldData.notifications?.favorites ?? true,
            tournamentReminders: oldData.notifications?.reminders ?? true,
          },
          display: {
            theme: oldData.theme || "system",
            compactMode: oldData.compact_mode || false,
            showRoundDetails: oldData.show_round_details ?? true,
          },
          timezone:
            oldData.timezone ||
            Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        stats: {
          totalTournaments: oldData.stats?.total_tournaments || 0,
          bestFinish: oldData.stats?.best_finish || 0,
          averageFinish: oldData.stats?.average_finish || 0,
          totalEarnings: oldData.stats?.total_earnings || 0,
          weeklyWins: oldData.stats?.weekly_wins || 0,
        },
      };
    } catch (error) {
      console.error("Failed to migrate user data:", error);
      return null;
    }
  }

  /**
   * Migrate old team data structure to new format
   */
  static migrateTeamData(oldData: any): Team | null {
    if (!oldData) return null;

    try {
      return {
        id: oldData.id || oldData.team_id,
        name: oldData.name || oldData.team_name,
        golfers: oldData.golfers || oldData.players || [],
        totalScore: oldData.total_score || oldData.totalScore || 0,
        position: oldData.position || oldData.rank || 0,
        owner: oldData.owner || oldData.user_id,
        isUserTeam: oldData.is_user_team || oldData.isUserTeam || false,
      };
    } catch (error) {
      console.error("Failed to migrate team data:", error);
      return null;
    }
  }
}

/**
 * Storage key migration for localStorage persistence
 */
export class StorageKeyMigration {
  private static OLD_KEYS = {
    TOURNAMENT: "tournament_data",
    USER: "user_data",
    TEAMS: "user_teams",
    SETTINGS: "user_settings",
  };

  private static NEW_KEYS = {
    TOURNAMENT: "pgc-tour-tournament-store",
    USER: "pgc-tour-user-store",
    LEADERBOARD: "pgc-tour-leaderboard-store",
    UI: "pgc-tour-ui-store",
  };

  /**
   * Migrate old localStorage keys to new format
   */
  static migrateStorageKeys(): void {
    try {
      // Migrate tournament data
      const oldTournamentData = localStorage.getItem(this.OLD_KEYS.TOURNAMENT);
      if (
        oldTournamentData &&
        !localStorage.getItem(this.NEW_KEYS.TOURNAMENT)
      ) {
        const migratedData = StoreMigration.migrateTournamentData(
          JSON.parse(oldTournamentData),
        );
        if (migratedData) {
          localStorage.setItem(
            this.NEW_KEYS.TOURNAMENT,
            JSON.stringify({
              state: {
                currentTournament: migratedData,
                tournaments: [migratedData],
                isLoading: false,
                error: null,
                lastUpdated: new Date(),
              },
              version: 0,
            }),
          );
        }
      }

      // Migrate user data
      const oldUserData = localStorage.getItem(this.OLD_KEYS.USER);
      if (oldUserData && !localStorage.getItem(this.NEW_KEYS.USER)) {
        const migratedData = StoreMigration.migrateUserData(
          JSON.parse(oldUserData),
        );
        if (migratedData) {
          localStorage.setItem(
            this.NEW_KEYS.USER,
            JSON.stringify({
              state: {
                profile: migratedData,
                userTeams: [],
                isAuthenticated: true,
                isLoading: false,
                error: null,
              },
              version: 0,
            }),
          );
        }
      }

      // Clean up old keys after successful migration
      Object.values(this.OLD_KEYS).forEach((key) => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
        }
      });

      console.log("Storage key migration completed successfully");
    } catch (error) {
      console.error("Failed to migrate storage keys:", error);
    }
  }

  /**
   * Clear all old storage keys
   */
  static clearOldStorageKeys(): void {
    Object.values(this.OLD_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
  }
}

/**
 * Gradual migration hook for components
 */
export function useGradualMigration<T>(
  oldHook: () => T,
  newHook: () => T,
  featureFlag: boolean,
): T {
  if (featureFlag) {
    return newHook();
  }
  return oldHook();
}

/**
 * Initialize migration process
 */
export function initializeStoreMigration(): void {
  // Only run migration on client side
  if (typeof window === "undefined") return;

  // Migrate storage keys
  StorageKeyMigration.migrateStorageKeys();

  // Log migration status
  console.log("Store migration initialized", {
    flags: FEATURE_FLAGS,
    timestamp: new Date().toISOString(),
  });
}
