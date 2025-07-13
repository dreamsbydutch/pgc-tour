/**
 * Team Update Cron Job Module
 * ============================
 *
 * Streamlined team update service that:
 * - Fetches tournament data with teams and golfers
 * - Calculates team scores based on current round and live play status
 * - Updates team positions based on scores
 * - Batch updates all teams in the database
 */

export { updateAllTeamsOptimized } from "./service";
export { handleTeamUpdateCron } from "./handler";
export type {
  TournamentWithRelations,
  CronJobResult,
  UpdateResult,
} from "./types";
