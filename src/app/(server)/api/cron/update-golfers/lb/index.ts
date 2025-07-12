/**
 * Golfer Update Cron Job Module
 * =============================
 *
 * Simplified, well-organized golfer update cron job with clear separation of concerns:
 *
 * - types.ts: Type definitions and interfaces
 * - services.ts: All business logic (data fetching, golfer operations, tournament updates)
 * - handler.ts: Main orchestration and error handling
 */

export { handleGolferUpdateCron } from "./handler";
export type {
  TournamentWithCourse,
  ExternalAPIData,
  CronJobResult,
  UpdateResult,
} from "./types";

// Re-export services for testing or manual use
export {
  fetchExternalData,
  createMissingGolfers,
  updateAllGolfers,
  updateTournamentStatus,
} from "./services";
