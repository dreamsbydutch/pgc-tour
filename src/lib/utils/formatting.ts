/**
 * @fileoverview Formatting utilities for numbers, money, scores, and text
 * Provides robust, type-safe formatting functions with comprehensive error handling
 */

/**
 * Formats a number with proper error handling and null safety
 * @param n - The number to format (can be number, string, null, undefined)
 * @param maxFractionDigits - Maximum number of decimal places (default: 1)
 * @returns Formatted number string or fallback value
 * @example
 * formatNumber(1234.567) // "1,234.6"
 * formatNumber("123.45") // "123.5"
 * formatNumber(null) // "-"
 */
export function formatNumber(
  n: number | string | null | undefined,
  maxFractionDigits: number = 1,
): string {
  // Handle null, undefined, empty string
  if (n == null || n === "") {
    return "-";
  }

  // Convert to number if string
  const num = typeof n === "string" ? parseFloat(n) : n;

  // Handle invalid numbers
  if (isNaN(num) || !isFinite(num)) {
    return "-";
  }

  // Format the number
  try {
    return Intl.NumberFormat("en-US", {
      maximumFractionDigits: Math.max(0, Math.min(20, maxFractionDigits)), // Clamp between 0-20
    }).format(num);
  } catch (error) {
    return num.toString();
  }
}

/**
 * Formats a number in compact notation (1.2K, 3.4M, etc.)
 * @param n - The number to format
 * @returns Formatted compact number string
 * @example
 * formatCompactNumber(1234) // "1.2K"
 * formatCompactNumber(1234567) // "1.2M"
 */
export function formatCompactNumber(
  n: number | string | null | undefined,
): string {
  const num = safeNumber(n, 0);

  try {
    return Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num);
  } catch (error) {
    return formatNumber(num);
  }
}

/**
 * Formats a monetary value with proper error handling and type safety
 * @param number - The number to format (accepts number, string, null, or undefined)
 * @param short - Whether to use short format (no cents) for smaller amounts
 * @returns Formatted money string or fallback value
 * @example
 * formatMoney(1234.56) // "$1,234.56"
 * formatMoney(1234567) // "$1.2M"
 * formatMoney(0) // "-"
 */
export function formatMoney(
  number: number | string | null | undefined,
  short = false,
): string {
  // Handle null/undefined cases
  if (number == null) return "-";

  // Convert to number and validate
  const num = typeof number === "string" ? parseFloat(number) : Number(number);

  // Handle invalid numbers
  if (isNaN(num) || !isFinite(num)) return "-";

  // Handle zero explicitly
  if (num === 0) return "-";

  try {
    const absNum = Math.abs(num);

    // Format large amounts with abbreviations
    if (absNum >= 1e6) {
      return "$" + (num / 1e6).toFixed(1) + "M";
    } else if (absNum >= 1e4) {
      return "$" + (num / 1e3).toFixed(0) + "k";
    } else {
      // Format smaller amounts with currency formatting
      return Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: short ? 0 : 2,
        minimumFractionDigits: short ? 0 : 2,
      }).format(num);
    }
  } catch (error) {
    return "-";
  }
}

/**
 * Formats a golf score with proper error handling and type safety
 * @param score - The score to format (number, null, undefined, or "E")
 * @returns Formatted score string
 * @example
 * formatScore(0) // "E"
 * formatScore(3) // "+3"
 * formatScore(-2) // -2
 * formatScore(null) // null
 */
export function formatScore(
  score: number | string | null | undefined | "E",
): string | number | null {
  // Handle null/undefined explicitly
  if (score == null) return null;

  // Handle string "E" case
  if (score === "E") return "E";

  // Convert to number if string
  const numScore = typeof score === "string" ? parseFloat(score) : score;

  // Handle invalid numbers
  if (isNaN(numScore) || !isFinite(numScore)) return null;

  try {
    // Handle unrealistic scores (updated range to -40 to 99)
    if (numScore > 99 || numScore < -40) {
      return null;
    }

    // Format based on score value
    if (numScore > 0) {
      return "+" + numScore;
    } else if (numScore === 0) {
      return "E";
    } else {
      return numScore; // Negative scores show as-is
    }
  } catch (error) {
    return null;
  }
}

/**
 * Formats the "thru" value for golf rounds with proper error handling
 * @param thru - The hole number the player is through (number, string, null, or undefined)
 * @param teetime - The tee time string to display if player hasn't started
 * @returns Formatted thru string, number, or teetime
 * @example
 * formatThru(18, "10:30 AM") // "F"
 * formatThru(9, "10:30 AM") // 9
 * formatThru(0, "10:30 AM") // "10:30 AM"
 */
export function formatThru(
  thru: number | string | null | undefined,
  teetime: string | null | undefined,
): string | number {
  // Handle null/undefined thru
  if (thru == null) {
    return teetime ?? "N/A";
  }

  // Convert to number if string
  const numThru = typeof thru === "string" ? parseFloat(thru) : thru;

  // Handle invalid numbers
  if (isNaN(numThru) || !isFinite(numThru)) {
    return teetime ?? "N/A";
  }

  try {
    // Handle completed round
    if (numThru >= 18) {
      return "F";
    }

    // Handle valid in-progress rounds
    if (numThru > 0 && numThru < 18) {
      return Math.floor(numThru); // Ensure integer display
    }

    // Handle not started (thru <= 0)
    return teetime ?? "N/A";
  } catch (error) {
    return teetime ?? "N/A";
  }
}

/**
 * Formats a percentage with proper error handling
 * @param value - The percentage value (0-100 or 0-1)
 * @param asDecimal - Whether input is decimal (0-1) vs percentage (0-100)
 * @returns Formatted percentage string
 * @example
 * formatPercentage(75) // "75.0%"
 * formatPercentage(0.75, true) // "75.0%"
 */
export function formatPercentage(
  value: number | string | null | undefined,
  asDecimal = false,
): string {
  const num = safeNumber(value, 0);
  const percentage = asDecimal ? num * 100 : num;

  try {
    return Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(asDecimal ? num : num / 100);
  } catch (error) {
    return `${percentage.toFixed(1)}%`;
  }
}

/**
 * Formats an ordinal number (1st, 2nd, 3rd, etc.)
 * @param number - The number to format
 * @returns Formatted ordinal string
 * @example
 * formatRank(1) // "1st"
 * formatRank(22) // "22nd"
 * formatRank(13) // "13th"
 */
export function formatRank(number: number | string | null | undefined): string {
  const num = safeNumber(number, 0);

  if (num <= 0) return "0th";

  // Special cases for 11th, 12th, 13th
  if (num >= 11 && num <= 13) {
    return num + "th";
  }

  // Check last digit
  const lastDigit = num % 10;
  switch (lastDigit) {
    case 1:
      return num + "st";
    case 2:
      return num + "nd";
    case 3:
      return num + "rd";
    default:
      return num + "th";
  }
}

/**
 * Formats a time value
 * @param time - Date object to format
 * @returns Formatted time string
 * @example
 * formatTime(new Date()) // "10:30 AM"
 */
export function formatTime(time: Date | string | null | undefined): string {
  const date = safeDate(time);
  if (!date) return "N/A";

  try {
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  } catch (error) {
    return "N/A";
  }
}

/**
 * Formats a date value
 * @param date - Date to format
 * @param format - Format style ('short' | 'medium' | 'long' | 'full')
 * @returns Formatted date string
 * @example
 * formatDate(new Date()) // "7/5/2025"
 * formatDate(new Date(), 'long') // "July 5, 2025"
 */
export function formatDate(
  date: Date | string | null | undefined,
  format: "short" | "medium" | "long" | "full" = "short",
): string {
  const dateObj = safeDate(date);
  if (!dateObj) return "N/A";

  try {
    return dateObj.toLocaleDateString("en-US", {
      dateStyle: format,
    });
  } catch (error) {
    return "N/A";
  }
}

/**
 * Safe numeric conversion with validation
 * @param value - Value to convert to number
 * @param fallback - Fallback value if conversion fails
 * @returns Valid number or fallback
 * @example
 * safeNumber("123") // 123
 * safeNumber("invalid", 0) // 0
 */
export function safeNumber(value: unknown, fallback = 0): number {
  if (value == null) return fallback;

  const num = typeof value === "string" ? parseFloat(value) : Number(value);

  return isNaN(num) || !isFinite(num) ? fallback : num;
}

/**
 * Safely converts a date-like value to a valid Date object
 * @param dateValue - Date, string, or null value
 * @returns Valid Date object or null if invalid
 */
function safeDate(dateValue: Date | string | null | undefined): Date | null {
  if (!dateValue) return null;

  try {
    const date =
      typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

// ============= FORMATTING FUNCTIONS =============
