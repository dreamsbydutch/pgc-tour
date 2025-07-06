/**
 * @fileoverview Tournament domain utilities
 * High-level tournament operations that extend base golf utilities
 * Provides business logic for tournament filtering, status checking, and navigation
 */

import type { Tournament } from "@prisma/client";
import { getTournamentStatus } from "./golf";
import { filterByPredicate, sortBy } from "../data/processing";

/**
 * Tournament status type for business operations
 */
export type TournamentStatus = "upcoming" | "current" | "completed";

/**
 * Tournament utilities for advanced filtering and operations
 * These functions extend the base golf utilities with business logic
 */
export const tournaments = {
  /**
   * Filters tournaments by status
   * @param tournaments - Array of tournaments to filter
   * @param status - Tournament status to filter by
   * @returns Filtered tournaments array
   * @example
   * tournaments.getByStatus(allTournaments, "current")
   */
  getByStatus(
    tournaments: Tournament[],
    status: TournamentStatus,
  ): Tournament[] {
    return filterByPredicate(
      tournaments,
      (tournament) =>
        getTournamentStatus(
          new Date(tournament.startDate),
          new Date(tournament.endDate),
        ) === status,
    );
  },

  /**
   * Gets the current active tournament
   * @param tournaments - Array of tournaments
   * @returns Current tournament or null if none active
   * @example
   * const current = tournaments.getCurrentTournament(allTournaments);
   */
  getCurrentTournament(tournaments: Tournament[]): Tournament | null {
    return this.getByStatus(tournaments, "current")[0] || null;
  },

  /**
   * Gets the next upcoming tournament
   * @param tournaments - Array of tournaments
   * @returns Next tournament or null if none upcoming
   * @example
   * const next = tournaments.getNextTournament(allTournaments);
   */
  getNextTournament(tournaments: Tournament[]): Tournament | null {
    const upcoming = this.getByStatus(tournaments, "upcoming");
    return (
      sortBy(upcoming, [{ key: "startDate", direction: "asc" }])[0] || null
    );
  },

  /**
   * Gets the most recent completed tournament
   * @param tournaments - Array of tournaments
   * @returns Most recent completed tournament or null
   * @example
   * const previous = tournaments.getPreviousTournament(allTournaments);
   */
  getPreviousTournament(tournaments: Tournament[]): Tournament | null {
    const completed = this.getByStatus(tournaments, "completed");
    return (
      sortBy(completed, [{ key: "endDate", direction: "desc" }])[0] || null
    );
  },

  /**
   * Gets all upcoming tournaments sorted by start date
   * @param tournaments - Array of tournaments
   * @returns Upcoming tournaments sorted ascending by start date
   * @example
   * const upcoming = tournaments.getUpcoming(allTournaments);
   */
  getUpcoming(tournaments: Tournament[]): Tournament[] {
    const upcoming = this.getByStatus(tournaments, "upcoming");
    return sortBy(upcoming, [{ key: "startDate", direction: "asc" }]);
  },

  /**
   * Gets all completed tournaments sorted by end date (most recent first)
   * @param tournaments - Array of tournaments
   * @returns Completed tournaments sorted descending by end date
   * @example
   * const completed = tournaments.getCompleted(allTournaments);
   */
  getCompleted(tournaments: Tournament[]): Tournament[] {
    const completed = this.getByStatus(tournaments, "completed");
    return sortBy(completed, [{ key: "endDate", direction: "desc" }]);
  },

  /**
   * Filters tournaments by season
   * @param tournaments - Array of tournaments
   * @param seasonId - Season ID to filter by
   * @returns Tournaments for the specified season
   * @example
   * const seasonTournaments = tournaments.getBySeason(allTournaments, "season-2024");
   */
  getBySeason(tournaments: Tournament[], seasonId: string): Tournament[] {
    return filterByPredicate(
      tournaments,
      (tournament) => tournament.seasonId === seasonId,
    );
  },

  /**
   * Gets tournaments within a date range
   * @param tournaments - Array of tournaments
   * @param startDate - Range start date
   * @param endDate - Range end date
   * @returns Tournaments within the date range
   * @example
   * const recent = tournaments.getByDateRange(allTournaments, lastWeek, today);
   */
  getByDateRange(
    tournaments: Tournament[],
    startDate: Date,
    endDate: Date,
  ): Tournament[] {
    return filterByPredicate(tournaments, (tournament) => {
      const tournamentStart = new Date(tournament.startDate);
      return tournamentStart >= startDate && tournamentStart <= endDate;
    });
  },

  /**
   * Checks if a tournament is currently live (active)
   * @param tournament - Tournament to check
   * @returns True if tournament is currently active
   * @example
   * if (tournaments.isLive(tournament)) { ... }
   */
  isLive(tournament: Tournament): boolean {
    return (
      getTournamentStatus(
        new Date(tournament.startDate),
        new Date(tournament.endDate),
      ) === "current"
    );
  },

  /**
   * Gets tournaments by multiple statuses
   * @param tournaments - Array of tournaments
   * @param statuses - Array of statuses to include
   * @returns Tournaments matching any of the provided statuses
   * @example
   * const activeOrUpcoming = tournaments.getByStatuses(allTournaments, ["current", "upcoming"]);
   */
  getByStatuses(
    tournaments: Tournament[],
    statuses: TournamentStatus[],
  ): Tournament[] {
    return filterByPredicate(tournaments, (tournament) => {
      const status = getTournamentStatus(
        new Date(tournament.startDate),
        new Date(tournament.endDate),
      );
      return statuses.includes(status);
    });
  },

  /**
   * Sorts tournaments by any field with direction
   * @param tournaments - Array of tournaments to sort
   * @param field - Field to sort by
   * @param direction - Sort direction
   * @returns Sorted tournaments array
   * @example
   * const sorted = tournaments.sortTournaments(allTournaments, "startDate", "desc");
   */
  sortTournaments<K extends keyof Tournament>(
    tournaments: Tournament[],
    field: K,
    direction: "asc" | "desc" = "asc",
  ): Tournament[] {
    return sortBy(tournaments, [{ key: field, direction }]);
  },
};

// Export for backward compatibility and ease of use
export const tournamentUtils = tournaments;

// Export individual functions for specific use cases
export const {
  getByStatus,
  getCurrentTournament,
  getNextTournament,
  getPreviousTournament,
  getUpcoming,
  getCompleted,
  getBySeason,
  getByDateRange,
  isLive,
  getByStatuses,
  sortTournaments,
} = tournaments;
