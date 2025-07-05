/**
 * @fileoverview Core primitive utilities for strings, numbers, and booleans
 * Essential operations that provide clear value beyond native JavaScript
 */

// ===== STRING UTILITIES =====

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(str: string): string {
  if (typeof str !== "string" || str.length === 0) {
    return "";
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalizes the first letter of each word
 */
export function titleCase(str: string): string {
  if (typeof str !== "string") {
    return "";
  }
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Truncates a string to a specified length with ellipsis
 */
export function truncate(
  str: string,
  maxLength: number,
  suffix = "...",
): string {
  if (typeof str !== "string") {
    return "";
  }
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Removes extra whitespace and normalizes spacing
 */
export function cleanWhitespace(str: string): string {
  if (typeof str !== "string") {
    return "";
  }
  return str.trim().replace(/\s+/g, " ");
}

/**
 * Converts a string to a URL-friendly slug
 */
export function slugify(input: string): string {
  if (typeof input !== "string") {
    return "";
  }
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Converts camelCase to kebab-case
 */
export function camelToKebab(str: string): string {
  if (typeof str !== "string") {
    return "";
  }
  return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Converts kebab-case to camelCase
 */
export function kebabToCamel(str: string): string {
  if (typeof str !== "string") {
    return "";
  }
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Escapes HTML special characters
 */
export function escapeHtml(str: string): string {
  if (typeof str !== "string") {
    return "";
  }
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
  };
  return str.replace(/[&<>"']/g, (match) => htmlEscapes[match]!);
}

/**
 * Checks if a string contains only alphanumeric characters
 */
export function isAlphanumeric(str: string): boolean {
  if (typeof str !== "string") {
    return false;
  }
  return /^[a-zA-Z0-9]+$/.test(str);
}

// ===== NUMBER UTILITIES =====

/**
 * Safe numeric conversion with validation
 */
export function safeNumber(value: unknown, fallback = 0): number {
  if (value == null) return fallback;
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  return isNaN(num) || !isFinite(num) ? fallback : num;
}

/**
 * Clamps a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Rounds a number to specified decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Checks if a number is within a specified range (inclusive)
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

// ===== BOOLEAN UTILITIES =====

/**
 * Safe boolean conversion
 */
export function safeBoolean(value: unknown, fallback = false): boolean {
  if (value == null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    return lower === "true" || lower === "1" || lower === "yes";
  }
  if (typeof value === "number") return value !== 0;
  return fallback;
}

/**
 * Toggle boolean value
 */
export function toggle(value: boolean): boolean {
  return !value;
}

// ===== SIZE FORMATTING UTILITIES =====

/**
 * Unified byte size formatting function
 * Replaces duplicate formatBytes and formatMemorySize functions
 */
export function formatBytes(
  bytes: number,
  options: {
    precision?: number;
    units?: string[];
    includeSpace?: boolean;
  } = {},
): string {
  const {
    precision = 1,
    units = ["B", "KB", "MB", "GB", "TB"],
    includeSpace = true,
  } = options;

  if (bytes === 0) return `0${includeSpace ? " " : ""}${units[0]}`;

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = (bytes / Math.pow(1024, i)).toFixed(precision);
  const unit = units[Math.min(i, units.length - 1)];

  return `${value}${includeSpace ? " " : ""}${unit}`;
}
