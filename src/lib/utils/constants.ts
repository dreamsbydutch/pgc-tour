/**
 * @fileoverview Application-wide constants
 * Central location for all magic numbers and configuration values
 */

// ===== UI DISPLAY CONSTANTS =====

/**
 * Maximum number of payouts/points to display in tournament popover
 */
export const MAX_PAYOUTS_DISPLAY = 35;

/**
 * Precision for yardage and numeric display (decimal places)
 */
export const YARDAGE_PRECISION = 0;

// ===== TOURNAMENT CONSTANTS =====

/**
 * Standard number of holes in a golf round
 */
export const HOLES_PER_ROUND = 18;

/**
 * Maximum reasonable golf score for validation
 */
export const MAX_GOLF_SCORE = 99;

/**
 * Minimum reasonable golf score for validation
 */
export const MIN_GOLF_SCORE = -40;

// ===== DATE AND TIME CONSTANTS =====

/**
 * Default tournament buffer days for timeline calculations
 */
export const DEFAULT_TOURNAMENT_BUFFER = {
  PRE_START: 3,
  POST_END: 1,
  PREVIOUS: 3,
  UPCOMING: 3,
} as const;
