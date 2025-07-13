/**
 * @file utils/index.ts
 * @description Central export file for all utility functions
 *
 * This file re-exports all utility functions from the utils folder
 * for easier importing throughout the application.
 */

// ============= MAIN UTILITIES =============

// Class name utilities
export { cn } from "./main";

// Array and object utilities
export {
  groupBy,
  sortItems,
  sortMultiple,
  filterItems,
  searchItems,
  batchUpdateItems,
  batchProcess,
  hasItems,
} from "./main";

// Type guards and validation
export {
  isNumber,
  isNonEmptyString,
  isValidEmail,
  isValidUrl,
  isInRange,
  hasProperty,
  isOneOf,
  assertDefined,
  isKeyOf,
  createTypePredicate,
  isDate,
} from "./main";

// Golf-specific type guards
export {
  isValidGolfScore,
  isValidHole,
  isValidRound,
  isValidTournamentDate,
  isValidTournamentStatus,
} from "./main";

// Formatters
export {
  formatNumber,
  formatCompactNumber,
  formatMoney,
  formatPercentage,
  formatRank,
  formatTime,
  formatDate,
  formatName,
  formatTournamentDateRange,
  formatScore,
} from "./main";

// API utilities
export { fetchDataGolf } from "./main";

// General utilities
export {
  capitalize,
  getPath,
  getGolferTeeTime,
  getTournamentTimeline,
  getErrorMessage,
} from "./main";

// ============= VALIDATORS =============

export { memberSchema } from "./validators";

// ============= TYPE EXPORTS =============

// Re-export any types that might be needed
export type { ClassValue } from "clsx";
