/**
 * Simple Golfer Update Cron Job Module
 * ====================================
 *
 * Streamlined golfer update service that:
 * - Fetches external data from DataGolf API
 * - Creates missing golfers
 * - Updates existing golfers with live data
 * - Updates tournament status
 */

export { updateAllGolfersOptimized } from "./service";
export type { TournamentWithCourse, CronJobResult } from "./types";
