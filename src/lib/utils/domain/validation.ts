// Business validation logic for tournaments, members, and forms
// Extracted from old-utils/validation.ts - business-specific validation only

import { z } from "zod";

/**
 * Business validation functions for golf tournament application
 * Focuses on domain-specific validation rules and form schemas
 */

export function isValidEmail(email: unknown): email is string {
  if (typeof email !== "string" || email.trim().length === 0) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidUrl(url: unknown): url is string {
  if (typeof url !== "string" || url.trim().length === 0) return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidTournamentDate(date: unknown): date is Date {
  if (!(date instanceof Date) || isNaN(date.getTime())) return false;

  const year = date.getFullYear();
  const currentYear = new Date().getFullYear();

  // Allow dates from 1950 to 50 years in the future
  return year >= 1950 && year <= currentYear + 50;
}

export function isValidTournamentStatus(
  status: unknown,
): status is "upcoming" | "current" | "completed" {
  return (
    typeof status === "string" &&
    ["upcoming", "current", "completed"].includes(status)
  );
}

export function validateMemberName(name: unknown): name is string {
  return typeof name === "string" && name.trim().length >= 3;
}

export function validateTransactionAmount(amount: unknown): amount is number {
  return typeof amount === "number" && amount > 0 && Number.isFinite(amount);
}

export function validateUserId(userId: unknown): userId is string {
  return typeof userId === "string" && userId.trim().length > 0;
}

export function validateSeasonId(seasonId: unknown): seasonId is string {
  return typeof seasonId === "string" && seasonId.trim().length > 0;
}

// ============= ZOD SCHEMAS =============

export const memberSchema = z.object({
  firstname: z.string().min(3, "First name must be at least 3 characters"),
  lastname: z.string().min(3, "Last name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
});

export const paymentSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  seasonId: z.string().min(1, "Season ID is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  transactionType: z.string().min(1, "Transaction type is required"),
});

export const tournamentSchema = z.object({
  name: z.string().min(1, "Tournament name is required"),
  startDate: z.date().refine(isValidTournamentDate, "Invalid tournament date"),
  endDate: z.date().refine(isValidTournamentDate, "Invalid tournament date"),
  status: z.enum(["upcoming", "current", "completed"]),
});

export const memberUpdateSchema = z.object({
  id: z.string().min(1, "Member ID is required"),
  firstname: z
    .string()
    .min(3, "First name must be at least 3 characters")
    .optional(),
  lastname: z
    .string()
    .min(3, "Last name must be at least 3 characters")
    .optional(),
  email: z.string().email("Please enter a valid email address").optional(),
});

// ============= TYPE EXPORTS =============

export type MemberFormData = z.infer<typeof memberSchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
export type TournamentFormData = z.infer<typeof tournamentSchema>;
export type MemberUpdateData = z.infer<typeof memberUpdateSchema>;

// ============= VALIDATION HELPERS =============

export function validateMemberForm(data: unknown): data is MemberFormData {
  try {
    memberSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function validatePaymentForm(data: unknown): data is PaymentFormData {
  try {
    paymentSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function validateTournamentForm(
  data: unknown,
): data is TournamentFormData {
  try {
    tournamentSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

export function getValidationErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): Record<string, string> | null {
  try {
    schema.parse(data);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join(".");
        errors[path] = err.message;
      });
      return errors;
    }
    return { general: "Validation failed" };
  }
}
