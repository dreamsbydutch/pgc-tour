/**
 * Utils Library Main Index
 *
 * Complete exports for the refactored utils library.
 * Organized by domain with clean import paths.
 */

// ============= CORE UTILITIES =============
// Essential building blocks used throughout the application

export * as arrays from "./core/arrays";
export * as objects from "./core/objects";
export * as types from "./core/types";
export * as primitives from "./core/primitives";

// Core utilities grouped export (still available from core/index.ts)
export * as core from "./core";

// ============= DOMAIN UTILITIES =============
// Business logic and domain-specific utilities

export * as golf from "./domain/golf";
export * as formatting from "./domain/formatting";
export * as dates from "./domain/dates";
export * as validation from "./domain/validation";
export * as teams from "./domain/teams";
export * as tournaments from "./domain/tournaments";

// ============= DATA UTILITIES =============
// Data processing, transformation, and manipulation

export * as processing from "./data/processing";
export * as sorting from "./data/sorting";
export * as aggregation from "./data/aggregation";
export * as transformation from "./data/transformation";
export * as enhancement from "./data/enhancement";

// ============= SYSTEM UTILITIES =============
// System-level utilities for API, caching, storage, and performance

export * as api from "./system/api";
export * as caching from "./system/caching";
export * as storage from "./system/storage";
export * as performance from "./system/performance";
export * as queries from "./system/queries";

// ============= TESTING UTILITIES =============
// Testing utilities including mocks, helpers, and fixtures

export * as mocks from "./testing/mocks";
export * as helpers from "./testing/helpers";
export * as fixtures from "./testing/fixtures";
