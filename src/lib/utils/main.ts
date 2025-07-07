import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge
 * Merges Tailwind CSS classes intelligently, handling conflicts
 * @param inputs - Class values to combine
 * @returns Merged class string
 * @example
 * cn("px-2 py-1", "px-4") // "py-1 px-4"
 * cn("text-red-500", isError && "text-red-700") // "text-red-700" if isError is true
 * cn(["bg-blue-500", "hover:bg-blue-600"], "rounded-lg") // "bg-blue-500 hover:bg-blue-600 rounded-lg"
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Minimal, aggressively refactored utility module for the golf tournament app
 * All core functionality preserved, all redundancy removed
 */

/**
 * Groups array items by a key function
 * @param array - Array to group
 * @param keyFn - Function to extract grouping key
 * @returns Object with grouped items
 * @example
 * groupBy([{type: 'A', value: 1}, {type: 'B', value: 2}], item => item.type)
 * // { A: [{type: 'A', value: 1}], B: [{type: 'B', value: 2}] }
 */
export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K,
): Record<K, T[]> {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

/**
 * Generic sort function with type safety
 * @param items - Items to sort
 * @param key - Key to sort by
 * @param direction - Sort direction
 * @returns Sorted array
 * @example
 * sortItems([{age: 25}, {age: 30}], 'age', 'asc') // [{age: 25}, {age: 30}]
 */
export function sortItems<T>(
  items: T[],
  key: keyof T,
  direction: "asc" | "desc" = "desc",
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal == null || bVal == null) return 0;
    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });
}

/**
 * Generic filter function that applies multiple filter criteria
 * @param items - Items to filter
 * @param filters - Filter criteria object
 * @returns Filtered array
 * @example
 * filterItems([{status: 'active', type: 'A'}], {status: 'active'})
 */
export function filterItems<T>(items: T[], filters: Record<string, any>): T[] {
  return items.filter((item) =>
    Object.entries(filters).every(([key, value]) => {
      if (value == null) return true;
      const itemValue = (item as any)[key];
      if (Array.isArray(value)) return value.includes(itemValue);
      if (typeof value === "object" && value !== null) {
        if ("min" in value && itemValue < value.min) return false;
        if ("max" in value && itemValue > value.max) return false;
        if ("start" in value && "end" in value) {
          const d = new Date(itemValue);
          return d >= value.start && d <= value.end;
        }
      }
      if (typeof value === "boolean") return Boolean(itemValue) === value;
      return itemValue === value;
    })
  );
}

/**
 * Generic search function with support for nested fields
 * @param items - Items to search
 * @param query - Search query
 * @param searchFields - Fields to search in
 * @returns Filtered array matching search query
 * @example
 * searchItems([{name: 'John', course: {name: 'Pine Valley'}}], 'pine', ['name', 'course.name'])
 */
export function searchItems<T>(
  items: T[],
  query: string,
  searchFields: (keyof T | string)[],
): T[] {
  if (!query.trim()) return [];
  const lowerQuery = query.toLowerCase();
  return items.filter((item) =>
    searchFields.some((field) => {
      let value: any = item;
      for (const key of String(field).split(".")) {
        value = value?.[key];
        if (value == null) break;
      }
      return value && String(value).toLowerCase().includes(lowerQuery);
    })
  );
}

/**
 * Generic batch update function
 * @param items - Items to update
 * @param updates - Array of update operations
 * @returns Updated array
 * @example
 * batchUpdateItems([{id: '1', name: 'A'}], [{id: '1', updates: {name: 'B'}}])
 */
export function batchUpdateItems<T extends { id: string }>(
  items: T[],
  updates: Array<{ id: string; updates: Partial<T> }>,
): T[] {
  const updateMap = new Map(updates.map((u) => [u.id, u.updates]));
  return items.map((item) => updateMap.has(item.id) ? { ...item, ...updateMap.get(item.id)! } : item);
}

// ===== TYPE GUARDS & VALIDATION =====

/**
 * Type guard for number values
 * @param value - Value to check
 * @returns True if value is a number (excluding NaN)
 * @example
 * isNumber(123) // true
 * isNumber("123") // false
 * isNumber(NaN) // false
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value);
}

/**
 * Validates if a string is not empty after trimming
 * @param str - String to validate
 * @returns True if string is not empty
 * @example
 * isNonEmptyString("hello") // true
 * isNonEmptyString("  ") // false
 * isNonEmptyString(null) // false
 */
export function isNonEmptyString(str: unknown): str is string {
  return typeof str === "string" && str.trim().length > 0;
}

/**
 * Validates if a value is a valid email address
 * @param email - Email to validate
 * @returns True if valid email format
 * @example
 * isValidEmail("user@example.com") // true
 * isValidEmail("invalid-email") // false
 */
export function isValidEmail(email: unknown): email is string {
  return isNonEmptyString(email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validates if a value is a valid URL
 * @param url - URL to validate
 * @returns True if valid URL format
 * @example
 * isValidUrl("https://example.com") // true
 * isValidUrl("not-a-url") // false
 */
export function isValidUrl(url: unknown): url is string {
  if (!isNonEmptyString(url)) return false;
  try { new URL(url); return true; } catch { return false; }
}

/**
 * Validates if a value is within a specified range
 * @param value - Value to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns True if value is within range
 * @example
 * isInRange(5, 1, 10) // true
 * isInRange(15, 1, 10) // false
 */
export function isInRange(
  value: unknown,
  min: number,
  max: number,
): value is number {
  return isNumber(value) && value >= min && value <= max;
}

/**
 * Checks if an object has a specific property
 * @param obj - Object to check
 * @param key - Property key to check for
 * @returns True if object has the property
 * @example
 * hasProperty({a: 1, b: 2}, 'a') // true
 * hasProperty({a: 1}, 'c') // false
 */
export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K,
): obj is T & Record<K, unknown> {
  return key in obj;
}

/**
 * Type guard for checking if a value is one of the specified literals
 * @param value - Value to check
 * @param options - Array of valid options
 * @returns True if value is one of the options
 * @example
 * isOneOf("apple", ["apple", "banana"]) // true
 * isOneOf("orange", ["apple", "banana"]) // false
 */
export function isOneOf<T extends readonly unknown[]>(
  value: unknown,
  options: T,
): value is T[number] {
  return options.includes(value);
}

/**
 * Assertion function that throws if value is never
 * Useful for exhaustive type checking
 * @param value - Value that should never be reached
 * @throws Error if called
 * @example
 * switch (status) {
 *   case "pending": return handlePending();
 *   case "complete": return handleComplete();
 *   default: assertNever(status); // TypeScript error if new status added
 * }
 */
export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

/**
 * Assertion function that throws if value is null or undefined
 * @param value - Value to assert as defined
 * @param message - Optional error message
 * @throws Error if value is null or undefined
 * @example
 * assertDefined(user, "User must be defined");
 * // user is now typed as non-null
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string,
): asserts value is T {
  if (value == null) {
    throw new Error(message ?? "Value must be defined");
  }
}

/**
 * Type-safe key checking for objects
 * @param obj - Object to check
 * @param key - Key to check for
 * @returns True if key exists in object
 * @example
 * isKeyOf({a: 1, b: 2}, "a") // true
 * isKeyOf({a: 1, b: 2}, "c") // false
 */
export function isKeyOf<T extends object>(
  obj: T,
  key: string | number | symbol,
): key is keyof T {
  return key in obj;
}

/**
 * Creates a type predicate function for a specific type
 * @param predicate - Function that checks if value is of type T
 * @returns Type predicate function
 * @example
 * const isUser = createTypePredicate((value): value is User =>
 *   isObject(value) && isString(value.name) && isNumber(value.id)
 * );
 */
export function createTypePredicate<T>(
  predicate: (value: unknown) => value is T,
): (value: unknown) => value is T {
  return predicate;
}

// ============= GOLF-SPECIFIC TYPE GUARDS =============

/**
 * Validates if a value is a valid golf score
 * @param score - Score to validate
 * @returns True if valid golf score
 * @example
 * isValidGolfScore(75) // true
 * isValidGolfScore(-25) // true (eagle on par 5)
 * isValidGolfScore(150) // false
 */
export function isValidGolfScore(score: unknown): score is number {
  return isNumber(score) && score >= -40 && score <= 99;
}

/**
 * Validates if a value is a valid hole number (1-18)
 * @param hole - Hole number to validate
 * @returns True if valid hole number
 * @example
 * isValidHole(9) // true
 * isValidHole(0) // false
 * isValidHole(19) // false
 */
export function isValidHole(hole: unknown): hole is number {
  return isNumber(hole) && Number.isInteger(hole) && hole >= 1 && hole <= 18;
}

/**
 * Validates if a value is a valid round number (1-4)
 * @param round - Round number to validate
 * @returns True if valid round number
 * @example
 * isValidRound(2) // true
 * isValidRound(0) // false
 * isValidRound(5) // false
 */
export function isValidRound(round: unknown): round is number {
  return isNumber(round) && Number.isInteger(round) && round >= 1 && round <= 4;
}

/**
 * Validates if a date is within a reasonable range for golf tournaments
 * @param date - Date to validate
 * @returns True if date is reasonable for golf tournaments
 * @example
 * isValidTournamentDate(new Date()) // true
 * isValidTournamentDate(new Date("1900-01-01")) // false
 */
export function isValidTournamentDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime()) && date.getFullYear() >= 1950 && date.getFullYear() <= new Date().getFullYear() + 50;
}

/**
 * Validates if a value is a valid tournament status
 * @param status - Status to validate
 * @returns True if valid tournament status
 * @example
 * isValidTournamentStatus("upcoming") // true
 * isValidTournamentStatus("invalid") // false
 */
export function isValidTournamentStatus(
  status: unknown,
): status is "upcoming" | "current" | "completed" {
  return status === "upcoming" || status === "current" || status === "completed";
}

// ===== FORMATTERS =====

/**
 * Formats a number with proper error handling and localization
 */
export function formatNumber(
  n: number | string | null | undefined,
  maxFractionDigits: number = 1,
): string {
  if (n == null || n === "") return "-";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (typeof num !== "number" || isNaN(num) || !isFinite(num)) return "-";
  try {
    return Intl.NumberFormat("en-US", { maximumFractionDigits: Math.max(0, Math.min(20, maxFractionDigits)) }).format(num);
  } catch { return String(num); }
}

/**
 * Formats a number in compact notation (1.2K, 3.4M, etc.)
 */
export function formatCompactNumber(n: number | string | null | undefined): string {
  const num = safeNumber(n, 0);
  try {
    return Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(num);
  } catch { return formatNumber(num); }
}

/**
 * Formats a monetary value with smart abbreviations for large amounts
 */
export function formatMoney(
  number: number | string | null | undefined,
  short = false,
): string {
  const num = typeof number === "string" ? parseFloat(number) : Number(number);
  if (number == null || isNaN(num) || !isFinite(num) || num === 0) return "-";
  try {
    const absNum = Math.abs(num);
    if (absNum >= 1e6) return "$" + (num / 1e6).toFixed(1) + "M";
    if (absNum >= 1e4) return "$" + (num / 1e3).toFixed(0) + "k";
    return Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: short ? 0 : 2, minimumFractionDigits: short ? 0 : 2 }).format(num);
  } catch { return "-"; }
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
    return Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(asDecimal ? num : num / 100);
  } catch { return `${percentage.toFixed(1)}%`; }
}

/**
 * Formats an ordinal number (1st, 2nd, 3rd, etc.)
 */
export function formatRank(number: number | string | null | undefined): string {
  const num = safeNumber(number, 0);
  if (num <= 0) return "0th";
  if (num >= 11 && num <= 13) return num + "th";
  const lastDigit = num % 10;
  return num + (["th", "st", "nd", "rd"][lastDigit] || "th");
}

/**
 * Formats a time value
 */
export function formatTime(time: Date | string | null | undefined): string {
  if (!time) return "N/A";
  try {
    const date = typeof time === "string" ? new Date(time) : time;
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("en-US", { hour: "numeric", minute: "numeric", hour12: true });
  } catch { return "N/A"; }
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
    return dateObj.toLocaleDateString("en-US", { dateStyle: format });
  } catch { return "N/A"; }
}

/**
 * Formats a name for display purposes
 */
export function formatName(name: string, type: "display" | "full"): string {
  if (typeof name !== "string" || !name.trim()) return "";
  const [firstNameRaw, ...rest] = name.trim().split(/\s+/);
  const firstName = firstNameRaw || "";
  const lastName = rest.join(" ");
  const cap = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
  if (type === "full") return lastName ? `${cap(firstName)} ${cap(lastName)}` : cap(firstName);
  return lastName ? `${cap(firstName)[0]}. ${cap(lastName)}` : cap(firstName);
}

// ===== GENERAL UTILITIES =====

/**
 * Safe numeric conversion utility (imported from core)
 */
function safeNumber(value: unknown, fallback = 0): number {
  if (value == null) return fallback;
  const num = typeof value === "string" ? parseFloat(value) : Number(value);
  return isNaN(num) || !isFinite(num) ? fallback : num;
}
