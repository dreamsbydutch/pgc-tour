/**
 * Golfer Update Cron Job Module
 * =============================
 *
 * Highly optimized golfer update cron job with minimal database calls:
 *
 * - golfer-service.ts: Comprehensive service with both optimized and legacy approaches
 * - types.ts: Type definitions and interfaces
 * - handler.ts: Main orchestration using optimized service
 *
 * OPTIMIZATION IMPROVEMENTS:
 * - Uses direct Prisma queries instead of TRPC for batch operations
 * - Fetches all data in minimal queries with proper field selection
 * - Calculates all golfer data in memory before database updates
 * - Uses transaction batching to minimize database round trips
 * - Only updates fields that have actually changed
 * - Dramatically reduces database calls from ~100+ to ~5-10 per run
 */

export { handleGolferUpdateCron } from "./handler";
export {
  updateAllGolfersOptimized,
  fetchExternalData,
  createMissingGolfers,
  updateAllGolfers,
  updateTournamentStatus,
} from "./service";
export type {
  TournamentWithCourse,
  ExternalAPIData,
  CronJobResult,
  UpdateResult,
} from "./types";
