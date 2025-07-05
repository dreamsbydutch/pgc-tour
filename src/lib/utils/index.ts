/**
 * @fileoverview Main export file for all utility functions
 * Provides centralized access to all utility modules with clean imports
 *
 * @example
 * // Import specific functions
 * import { formatMoney, sortGolfers, cn } from "@/lib/utils";
 *
 * // Import entire modules
 * import { formatting, validation, golf } from "@/lib/utils";
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind CSS merge functionality
 * @param inputs - Class values to merge
 * @returns Merged class string
 * @example
 * cn("px-2 py-1", "bg-blue-500", { "text-white": true }) // "px-2 py-1 bg-blue-500 text-white"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export clsx for direct use if needed
export { clsx } from "clsx";
export type { ClassValue } from "clsx";

// Re-export all formatting utilities
export * from "./formatting";

// Re-export all validation utilities
export * from "./validation";

// Re-export all sorting utilities
export * from "./sorting";

// Re-export all date utilities
export * from "./dates";

// Re-export all golf utilities
export * from "./golf";

// Re-export all string utilities
export * from "./strings";

// Re-export all array utilities
export * from "./arrays";

// Re-export all API utilities
export * from "./api";

// Re-export all caching utilities
export * from "./caching";

// Re-export all test utilities
export * from "./test";

// Re-export all storage utilities
export * from "./storage";

// Named module exports for organized imports
export * as formatting from "./formatting";
export * as validation from "./validation";
export * as sorting from "./sorting";
export * as dates from "./dates";
export * as golf from "./golf";
export * as strings from "./strings";
export * as arrays from "./arrays";
export * as api from "./api";
export * as caching from "./caching";
export * as test from "./test";
export * as storage from "./storage";

// Keep the original utils that are commonly used throughout the app
export const groupChatLink = "https://chat.whatsapp.com/EDhyiqWF10jImlvgbLQcVD";
