/**
 * Types Index
 *
 * Centralized exports for all type definitions used across the application.
 * This provides a single import point for all hook-related types while
 * maintaining organized separation of concerns.
 *
 * @fileoverview Central type exports
 */

// ============================================================================
// HOOK TYPES
// ============================================================================

export * from "./hooks";

// ============================================================================
// ENTITY TYPES
// ============================================================================

export * from "./entities";

// ============================================================================
// EXTERNAL TYPES
// ============================================================================

// Re-export commonly used external types for convenience
export * from "./datagolf_types";

// ============================================================================
// TYPE UTILITIES
// ============================================================================

/**
 * Utility type for making all properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utility type for making specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Utility type for deep partial
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Utility type for extracting array element type
 */
export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

/**
 * Utility type for non-nullable
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Utility type for function parameters
 */
export type Parameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;

/**
 * Utility type for function return type
 */
export type ReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;
