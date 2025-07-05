/**
 * @fileoverview Domain formatting utilities for display and presentation
 * High-level formatting functions for money, percentages, dates, ranks, and names
 */

// ===== NUMERIC FORMATTING =====

/**
 * Formats a number with proper error handling and localization
 */
export function formatNumber(
  n: number | string | null | undefined,
  maxFractionDigits: number = 1,
): string {
  if (n == null || n === "") {
    return "-";
  }

  const num = typeof n === "string" ? parseFloat(n) : n;

  if (isNaN(num) || !isFinite(num)) {
    return "-";
  }

  try {
    return Intl.NumberFormat("en-US", {
      maximumFractionDigits: Math.max(0, Math.min(20, maxFractionDigits)),
    }).format(num);
  } catch (error) {
    console.warn("formatNumber: Error formatting number", { input: n, error });
    return num.toString();
  }
}

/**
 * Formats a number in compact notation (1.2K, 3.4M, etc.)
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
    console.warn("formatCompactNumber: Error formatting number", {
      input: n,
      error,
    });
    return formatNumber(num);
  }
}

/**
 * Formats a monetary value with smart abbreviations for large amounts
 */
export function formatMoney(
  number: number | string | null | undefined,
  short = false,
): string {
  if (number == null) return "-";

  const num = typeof number === "string" ? parseFloat(number) : Number(number);

  if (isNaN(num) || !isFinite(num)) return "-";
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
    console.warn("formatMoney: Error formatting money", {
      input: number,
      error,
    });
    return "-";
  }
}

/**
 * Formats a percentage with proper error handling
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
    console.warn("formatPercentage: Error formatting percentage", {
      input: value,
      error,
    });
    return `${percentage.toFixed(1)}%`;
  }
}

// ===== ORDINAL AND RANKING =====

/**
 * Formats an ordinal number (1st, 2nd, 3rd, etc.)
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

// ===== DATE AND TIME FORMATTING =====

/**
 * Formats a time value
 */
export function formatTime(time: Date | string | null | undefined): string {
  if (!time) return "N/A";

  try {
    const date = typeof time === "string" ? new Date(time) : time;
    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  } catch (error) {
    console.warn("formatTime: Error formatting time", { input: time, error });
    return "N/A";
  }
}

/**
 * Formats a date value with configurable style
 */
export function formatDate(
  date: Date | string | null | undefined,
  format: "short" | "medium" | "long" | "full" = "short",
): string {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "N/A";

    return dateObj.toLocaleDateString("en-US", {
      dateStyle: format,
    });
  } catch (error) {
    console.warn("formatDate: Error formatting date", { input: date, error });
    return "N/A";
  }
}

// ===== NAME AND TEXT FORMATTING =====

/**
 * Formats a name for display purposes
 */
export function formatName(name: string, type: "display" | "full"): string {
  if (typeof name !== "string" || !name.trim()) {
    return "";
  }

  const splitName = name.trim().split(/\s+/);

  if (splitName.length === 0) {
    return "";
  }

  const firstName = splitName[0];
  const lastName = splitName.slice(1).join(" ");

  if (!firstName) {
    return "";
  }

  // Capitalize first letter of each part
  const capitalizedFirst =
    firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const capitalizedLast = lastName
    ? lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase()
    : "";

  if (type === "full") {
    return lastName
      ? `${capitalizedFirst} ${capitalizedLast}`
      : capitalizedFirst;
  } else {
    return lastName
      ? `${capitalizedFirst.charAt(0)}. ${capitalizedLast}`
      : capitalizedFirst;
  }
}

// ===== HELPER FUNCTION =====

/**
 * Safe numeric conversion utility (imported from core)
 */
function safeNumber(value: unknown, fallback = 0): number {
  if (value == null) return fallback;
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  return isNaN(num) || !isFinite(num) ? fallback : num;
}
