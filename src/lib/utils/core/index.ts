/**
 * Core Utilities Index
 *
 * Consolidated exports for the most commonly used core utility functions.
 * These are the essential building blocks used throughout the application.
 */

// ============= ARRAY UTILITIES =============
export {
  groupBy,
  unique,
  chunk,
  flatten,
  intersection,
  difference,
  partition,
  keyBy,
  shuffle,
  hasItems,
  first,
  last,
  sample,
  sampleSize,
  count,
  isEqual,
  findIndexBy,
} from "./arrays";

// ============= OBJECT UTILITIES =============
export {
  pick,
  omit,
  isEmpty,
  get,
  getPath,
  setPath,
  deepClone,
  deepMerge,
  keys,
  values,
  entries,
  filterObject,
  mapObject,
  hasProperty,
} from "./objects";

// ============= TYPE GUARDS =============
export {
  isDefined,
  isNullish,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isArray,
  isFunction,
  isDate,
  isNonEmptyString,
  isPositiveNumber,
  isNonNegativeNumber,
  isNonEmptyArray,
  isValidEmail,
  isValidUrl,
  isInRange,
  isOneOf,
  assertNever,
  assertDefined,
  isKeyOf,
} from "./types";

// ============= PRIMITIVE UTILITIES =============
export {
  capitalize,
  titleCase,
  truncate,
  cleanWhitespace,
  slugify,
  camelToKebab,
  kebabToCamel,
  escapeHtml,
  isAlphanumeric,
  safeNumber,
  clamp,
  roundTo,
  inRange,
  safeBoolean,
  toggle,
  formatBytes,
} from "./primitives";

// ============= COMMON PATTERNS =============

// Import functions for the core object
import {
  isDefined as _isDefined,
  isNonEmptyString as _isNonEmptyString,
} from "./types";

import {
  groupBy as _groupBy,
  unique as _unique,
  flatten as _flatten,
  chunk as _chunk,
  hasItems as _hasItems,
} from "./arrays";

import {
  pick as _pick,
  omit as _omit,
  isEmpty as _isEmpty,
  get as _get,
} from "./objects";

import {
  capitalize as _capitalize,
  slugify as _slugify,
  clamp as _clamp,
  safeNumber as _safeNumber,
  formatBytes as _formatBytes,
} from "./primitives";

// Most frequently used functions for direct import
export const core = {
  // Type checking
  isDefined: _isDefined,
  isNonEmptyString: _isNonEmptyString,
  hasItems: _hasItems,

  // Arrays
  groupBy: _groupBy,
  unique: _unique,
  flatten: _flatten,
  chunk: _chunk,

  // Objects
  pick: _pick,
  omit: _omit,
  isEmpty: _isEmpty,
  get: _get,

  // Primitives
  capitalize: _capitalize,
  slugify: _slugify,
  clamp: _clamp,
  safeNumber: _safeNumber,
  formatBytes: _formatBytes,
} as const;

// Re-export individual modules for specific use cases
export * as arrays from "./arrays";
export * as objects from "./objects";
export * as types from "./types";
export * as primitives from "./primitives";
