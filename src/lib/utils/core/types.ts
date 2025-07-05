/**
 * Type guards and type utilities
 * Consolidated validation with enhanced type safety for the golf tournament app
 *
 * @fileoverview Core type checking utilities consolidated from validation.ts
 * Focus on performance, type safety, and common validation scenarios
 * Optimized for efficiency and minimal redundancy
 */

/**
 * Type guard for checking if a value is defined (not null or undefined)
 * @param value - Value to check
 * @returns True if value is defined
 * @example
 * isDefined("hello") // true
 * isDefined(null) // false
 * isDefined(undefined) // false
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value != null;
}

/**
 * Type guard for checking if a value is null or undefined
 * @param value - Value to check
 * @returns True if value is null or undefined
 * @example
 * isNullish(null) // true
 * isNullish(undefined) // true
 * isNullish("hello") // false
 */
export function isNullish(value: unknown): value is null | undefined {
  return value == null;
}

/**
 * Type guard for string values
 * @param value - Value to check
 * @returns True if value is a string
 * @example
 * isString("hello") // true
 * isString(123) // false
 */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

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
 * Type guard for boolean values
 * @param value - Value to check
 * @returns True if value is a boolean
 * @example
 * isBoolean(true) // true
 * isBoolean("true") // false
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * Type guard for array values
 * @param value - Value to check
 * @returns True if value is an array
 * @example
 * isArray([1, 2, 3]) // true
 * isArray("123") // false
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard for object values (excluding arrays and null)
 * @param value - Value to check
 * @returns True if value is an object
 * @example
 * isObject({a: 1}) // true
 * isObject([1, 2]) // false
 * isObject(null) // false
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Type guard for function values
 * @param value - Value to check
 * @returns True if value is a function
 * @example
 * isFunction(() => {}) // true
 * isFunction("function") // false
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === "function";
}

/**
 * Type guard for Date objects
 * @param value - Value to check
 * @returns True if value is a valid Date
 * @example
 * isDate(new Date()) // true
 * isDate("2023-01-01") // false
 * isDate(new Date("invalid")) // false
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
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
 * Validates if a value is a positive number
 * @param value - Value to validate
 * @returns True if positive number
 * @example
 * isPositiveNumber(5) // true
 * isPositiveNumber(-1) // false
 * isPositiveNumber(0) // false
 */
export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

/**
 * Validates if a value is a non-negative number (including zero)
 * @param value - Value to validate
 * @returns True if non-negative number
 * @example
 * isNonNegativeNumber(0) // true
 * isNonNegativeNumber(5) // true
 * isNonNegativeNumber(-1) // false
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}

/**
 * Validates if an array has items
 * @param arr - Array to validate
 * @returns True if array has items (with type narrowing)
 * @example
 * isNonEmptyArray([1, 2, 3]) // true (type is [T, ...T[]])
 * isNonEmptyArray([]) // false
 * isNonEmptyArray(null) // false
 */
export function isNonEmptyArray<T>(arr: unknown): arr is [T, ...T[]] {
  return Array.isArray(arr) && arr.length > 0;
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
  if (!isNonEmptyString(email)) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
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
  if (!isDate(date)) return false;

  const year = date.getFullYear();
  const currentYear = new Date().getFullYear();

  // Allow dates from 1950 to 50 years in the future
  return year >= 1950 && year <= currentYear + 50;
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
  return isOneOf(status, ["upcoming", "current", "completed"] as const);
}

// ============= UTILITY TYPES =============

/**
 * Extract non-nullable properties from a type
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Make specific properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Type for exhaustive switch case checking
 */
export type Exhaustive<T> = T extends never ? never : never;
