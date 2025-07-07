# Minimal Utility Functions

This module provides a minimal, aggressively refactored set of utility functions for the golf tournament app. All core functionality is preserved, with redundancy removed and only the most essential, widely-used utilities included.

## Array & Object Utilities

- `groupBy(array, keyFn)` — Groups array items by a key function, returning an object of arrays keyed by the result of `keyFn`.
- `sortItems(items, key, direction?)` — Sorts an array of objects by a specified key and direction.
- `filterItems(items, filters)` — Filters an array of objects by multiple filter criteria (supports arrays, ranges, dates, booleans, and exact matches).
- `searchItems(items, query, searchFields)` — Searches an array of objects for a query string in specified fields (supports nested fields).
- `batchUpdateItems(items, updates)` — Batch-updates items in an array by id.

## Type Guards & Validation

- `isNumber(value)` — Checks if a value is a number (not NaN).
- `isNonEmptyString(str)` — Checks if a string is not empty after trimming.
- `isValidEmail(email)` — Checks if a value is a valid email address.
- `isValidUrl(url)` — Checks if a value is a valid URL.
- `isInRange(value, min, max)` — Checks if a value is within a specified range.
- `hasProperty(obj, key)` — Checks if an object has a specific property.
- `isOneOf(value, options)` — Checks if a value is one of the specified options.
- `assertNever(value)` — Throws if called (for exhaustive type checking).
- `assertDefined(value, message?)` — Throws if value is null or undefined.
- `isKeyOf(obj, key)` — Checks if a key exists in an object.
- `createTypePredicate(predicate)` — Creates a type predicate function.
- `isValidGolfScore(score)` — Checks if a value is a valid golf score.
- `isValidHole(hole)` — Checks if a value is a valid hole number (1-18).
- `isValidRound(round)` — Checks if a value is a valid round number (1-4).
- `isValidTournamentDate(date)` — Checks if a date is valid for tournaments.
- `isValidTournamentStatus(status)` — Checks if a value is a valid tournament status.

## Formatters

- `formatNumber(n, maxFractionDigits?)` — Formats a number with localization and error handling.
- `formatCompactNumber(n)` — Formats a number in compact notation (e.g., 1.2K, 3.4M).
- `formatMoney(number, short?)` — Formats a monetary value with abbreviations for large amounts.
- `formatPercentage(value, asDecimal?)` — Formats a percentage with proper error handling.
- `formatRank(number)` — Formats an ordinal number (e.g., 1st, 2nd, 3rd).
- `formatTime(time)` — Formats a time value for display.
- `formatDate(date, format?)` — Formats a date value with configurable style.
- `formatName(name, type)` — Formats a name for display purposes (display or full).

## General Utilities

- `safeNumber(value, fallback?)` — Safely converts a value to a number.
- `cn(...inputs)` — Combines class names using clsx and tailwind-merge, intelligently merging Tailwind CSS classes.
