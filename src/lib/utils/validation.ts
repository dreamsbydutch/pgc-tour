/**
 * @fileoverview Validation utilities for type checking and data validation
 * Provides robust validation functions for common data types and business logic
 */

import { z } from "zod";
import { safeNumber } from "./formatting";

/**
 * Validates if a value is a valid golf score
 * @param score - Score to validate
 * @returns True if valid golf score
 * @example
 * isValidGolfScore(75) // true
 * isValidGolfScore(-25) // true
 * isValidGolfScore(150) // false
 */
export function isValidGolfScore(score: unknown): score is number {
  const num = safeNumber(score, NaN);
  return !isNaN(num) && num >= -40 && num <= 99;
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
  const num = safeNumber(hole, 0);
  return Number.isInteger(num) && num >= 1 && num <= 18;
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
  const num = safeNumber(round, 0);
  return Number.isInteger(num) && num >= 1 && num <= 4;
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
 * Validates if a date is within a reasonable range for golf tournaments
 * @param date - Date to validate
 * @returns True if date is reasonable for golf tournaments
 * @example
 * isValidTournamentDate(new Date()) // true
 * isValidTournamentDate(new Date("1900-01-01")) // false
 */
export function isValidTournamentDate(date: unknown): date is Date {
  if (!(date instanceof Date) || isNaN(date.getTime())) return false;

  const year = date.getFullYear();
  const currentYear = new Date().getFullYear();

  // Allow dates from 1950 to 50 years in the future
  return year >= 1950 && year <= currentYear + 50;
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
  const num = safeNumber(value, -1);
  return num > 0;
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
  const num = safeNumber(value, -1);
  return num >= 0;
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
  const num = safeNumber(value, min - 1);
  return num >= min && num <= max;
}

/**
 * Validates if an array has items
 * @param arr - Array to validate
 * @returns True if array has items
 * @example
 * hasItems([1, 2, 3]) // true
 * hasItems([]) // false
 * hasItems(null) // false
 */
export function hasItems<T>(arr: unknown): arr is T[] {
  return Array.isArray(arr) && arr.length > 0;
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
  return (
    typeof status === "string" &&
    ["upcoming", "current", "completed"].includes(status)
  );
}

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

// ============= ZOD SCHEMAS =============

/**
 * Schema for validating member data
 */
export const memberSchema = z.object({
  firstname: z.string().min(3, "First name must be at least 3 characters"),
  lastname: z.string().min(3, "Last name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
});

/**
 * Schema for validating payment/transaction data
 */
export const paymentSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  seasonId: z.string().min(1, "Season ID is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  transactionType: z.string().min(1, "Transaction type is required"),
});

/**
 * Type exports for the schemas
 */
export type MemberFormData = z.infer<typeof memberSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
