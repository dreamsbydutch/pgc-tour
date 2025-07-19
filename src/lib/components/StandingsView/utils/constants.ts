/**
 * Constants and configuration for StandingsView component
 */

// ================= STANDINGS THRESHOLDS =================

/**
 * Position thresholds for different playoff tiers
 */
export const PLAYOFF_THRESHOLDS = {
  /** Maximum position for gold playoff qualification */
  GOLD_CUTOFF: 15,
  /** Maximum position for silver playoff qualification */
  SILVER_CUTOFF: 35,
} as const;

/**
 * Points thresholds and configurations
 */
export const POINTS_CONFIG = {
  /** Minimum points to be considered active */
  MIN_ACTIVE_POINTS: 0,
  /** Points display precision */
  DECIMAL_PLACES: 0,
} as const;

// ================= UI CONSTANTS =================

/**
 * Loading skeleton configuration
 */
export const LOADING_CONFIG = {
  /** Number of skeleton rows to show */
  SKELETON_ROWS: 20,
  /** Animation duration for loading states */
  ANIMATION_DURATION: 200,
} as const;

/**
 * Table column configurations
 */
export const TABLE_COLUMNS = {
  /** Column widths for different screen sizes */
  WIDTHS: {
    POSITION: "w-12",
    NAME: "flex-1",
    POINTS: "w-20",
    CHANGE: "w-16",
  },
  /** Column headers */
  HEADERS: {
    POSITION: "Pos",
    NAME: "Player",
    POINTS: "Points",
    CHANGE: "Change",
  },
} as const;

// ================= FRIEND MANAGEMENT =================

/**
 * Friend management configuration
 */
export const FRIEND_CONFIG = {
  /** Maximum number of friends allowed */
  MAX_FRIENDS: 50,
  /** Debounce time for friend updates (ms) */
  UPDATE_DEBOUNCE: 500,
} as const;

// ================= TOUR CONFIGURATIONS =================

/**
 * Tour type configurations and display settings
 */
export const TOUR_CONFIGS = {
  regular: {
    id: "regular",
    displayName: "Regular Season",
    description: "Current season standings",
  },
  playoffs: {
    id: "playoffs",
    displayName: "Playoffs",
    description: "Playoff qualification standings",
  },
} as const;

// ================= ERROR MESSAGES =================

/**
 * Standard error messages for different scenarios
 */
export const ERROR_MESSAGES = {
  LOADING_FAILED: "Failed to load standings data",
  NO_DATA: "No standings data available",
  FRIEND_UPDATE_FAILED: "Failed to update friend status",
  NETWORK_ERROR: "Network error occurred",
  UNKNOWN_ERROR: "An unknown error occurred",
} as const;

// ================= ANIMATION CLASSES =================

/**
 * CSS classes for animations and transitions
 */
export const ANIMATION_CLASSES = {
  FADE_IN: "duration-500 animate-in fade-in",
  SLIDE_IN: "duration-300 animate-in slide-in-from-top",
  LOADING_PULSE: "animate-pulse",
  HOVER_SCALE: "hover:scale-105 transition-transform",
} as const;
