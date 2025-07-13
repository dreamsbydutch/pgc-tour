/**
 * Update Standings Cron Job Module
 * =================================
 *
 * Streamlined standings update service that:
 * - Fetches current season and tour cards
 * - Calculates statistics for each tour card (wins, top tens, earnings, etc.)
 * - Determines positions based on points
 * - Batch updates all tour cards in the database
 */

export { updateStandingsOptimized } from "./service";
export { handleUpdateStandingsCron } from "./handler";
export type {
  TourCardWithRelations,
  TourCardCalculation,
  CronJobResult,
  UpdateResult,
} from "./types";
