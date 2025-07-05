/**
 * @fileoverview Main export file for the optimized golf tournament utils suite
 *
 * Provides centralized access to all purely functional utility modules with:
 * - Zero redundancy through shared utilities
 * - 100% type safety with comprehensive type guards
 * - Strategic error logging only for critical failures
 * - Maximum efficiency through optimized shared logic
 *
 * @example Named imports (recommended for tree-shaking)
 * import { formatMoney, sortGolfers, parsePosition, cn } from "@/lib/utils";
 *
 * @example Module imports for organized code
 * import { formatting, validation, golf } from "@/lib/utils";
 *
 * @example Direct module imports for specific use cases
 * import * as golfUtils from "@/lib/utils/golf";
 * import * as dateUtils from "@/lib/utils/dates";
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind CSS merge functionality.
 * Essential utility for conditional styling in React components.
 *
 * @param inputs - Class values to merge (strings, objects, arrays)
 * @returns Merged and optimized class string
 *
 * @example Basic usage
 * cn("px-2 py-1", "bg-blue-500") // "px-2 py-1 bg-blue-500"
 *
 * @example Conditional classes
 * cn("px-2 py-1", { "bg-blue-500": isActive, "bg-gray-500": !isActive })
 *
 * @example Tailwind conflict resolution
 * cn("px-2", "px-4") // "px-4" (last wins)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export clsx for direct use if needed
export { clsx } from "clsx";
export type { ClassValue } from "clsx";

// ============= INDIVIDUAL FUNCTION EXPORTS =============
// All utilities available for direct named imports (recommended for tree-shaking)

// Formatting utilities - data presentation and display
export * from "./formatting";

// Validation utilities - type guards and data validation
export * from "./validation";

// Sorting utilities - optimized comparison and ordering
export * from "./sorting";

// Date utilities - pure date manipulation and calculations
export * from "./dates";

// Golf-specific utilities - tournament scoring and management
export * from "./golf";

// String utilities - text manipulation and formatting
export * from "./strings";

// Array utilities - collection operations and transformations
export * from "./arrays";

// API utilities - network requests with strategic error logging
export * from "./api";

// ============= MODULE EXPORTS =============
// Named module exports for organized imports and namespace isolation

export * as formatting from "./formatting";
export * as validation from "./validation";
export * as sorting from "./sorting";
export * as dates from "./dates";
export * as golf from "./golf";
export * as strings from "./strings";
export * as arrays from "./arrays";
export * as api from "./api";

// ============= LEGACY EXPORTS =============
// Application-specific constants and legacy exports

/** WhatsApp group chat link for tournament communications */
export const groupChatLink = "https://chat.whatsapp.com/EDhyiqWF10jImlvgbLQcVD";
