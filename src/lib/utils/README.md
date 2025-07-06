## core/arrays.ts — Utility Functions

- `groupBy(array, keyFn)` — Groups array items by a key function, returning an object of arrays keyed by the result of `keyFn`.
- `unique(array, keyFn?)` — Removes duplicate items from an array, optionally using a key function for uniqueness.
- `chunk(array, size)` — Splits an array into chunks of the specified size.
- `flatten(array)` — Flattens a nested array by one level.
- `intersection(array1, array2)` — Returns an array of items present in both input arrays.
- `difference(array1, array2)` — Returns an array of items in `array1` that are not in `array2`.
- `partition(array, predicate)` — Splits an array into two arrays: items where the predicate is true, and items where it is false.
- `keyBy(array, keyFn)` — Converts an array to an object, keyed by the result of `keyFn` for each item.
- `hasItems(array)` — Type-safe check if an array has any items.
- `first(array)` — Returns the first item in an array, or `undefined` if empty.
- `last(array)` — Returns the last item in an array, or `undefined` if empty.
- `sample(array)` — Returns a random item from an array, or `undefined` if empty.
- `sampleSize(array, count)` — Returns an array of `count` random items from the input array (without replacement).
- `shuffle(array)` — Returns a new array with the items shuffled in random order.
- `count(array, keyFn?)` — Counts occurrences of each unique value (or key) in the array, returning an object of counts.
- `isEqual(array1, array2)` — Checks if two arrays are shallowly equal (same length and items in order).
- `findIndexBy(array, keyFn, value)` — Finds the index of the first item in the array where `keyFn(item) === value`, or `-1` if not found.

## core/objects.ts — Utility Functions

- `pick(obj, keys)` — Picks specific properties from an object.
- `omit(obj, keys)` — Omits specific properties from an object.
- `deepClone(obj)` — Deep clones an object or array.
- `deepMerge(target, ...sources)` — Deeply merges two or more objects.
- `isEmpty(obj)` — Checks if an object, array, or string is empty.
- `get(obj, key, defaultValue?)` — Gets a property value safely.
- `getPath(obj, path, defaultValue?)` — Gets a nested property value using dot notation.
- `setPath(obj, path, value)` — Sets a nested property value using dot notation.
- `hasProperty(obj, key)` — Checks if an object has a specific property.
- `keys(obj)` — Gets all keys of an object.
- `values(obj)` — Gets all values of an object.
- `entries(obj)` — Gets all entries ([key, value] pairs) of an object.
- `filterObject(obj, predicate)` — Filters object properties based on a predicate.
- `mapObject(obj, mapper)` — Maps object values while preserving keys.

## core/primitives.ts — Utility Functions

- `capitalize(str)` — Capitalizes the first letter of a string.
- `titleCase(str)` — Capitalizes the first letter of each word.
- `truncate(str, maxLength, suffix?)` — Truncates a string to a specified length with ellipsis.
- `cleanWhitespace(str)` — Removes extra whitespace and normalizes spacing.
- `slugify(input)` — Converts a string to a URL-friendly slug.
- `camelToKebab(str)` — Converts camelCase to kebab-case.
- `kebabToCamel(str)` — Converts kebab-case to camelCase.
- `escapeHtml(str)` — Escapes HTML special characters.
- `isAlphanumeric(str)` — Checks if a string contains only alphanumeric characters.
- `safeNumber(value, fallback?)` — Safely converts a value to a number.
- `clamp(value, min, max)` — Clamps a number between min and max.
- `roundTo(value, decimals)` — Rounds a number to specified decimal places.
- `inRange(value, min, max)` — Checks if a number is within a specified range.
- `safeBoolean(value, fallback?)` — Safely converts a value to boolean.
- `toggle(value)` — Toggles a boolean value.
- `formatBytes(bytes, options?)` — Formats a byte value as a human-readable string.

## core/types.ts — Utility Functions

- `cn(...inputs)` — Combines class names using clsx and tailwind-merge.
- `isDefined(value)` — Checks if a value is not null or undefined.
- `isNullish(value)` — Checks if a value is null or undefined.
- `isString(value)` — Checks if a value is a string.
- `isNumber(value)` — Checks if a value is a number (not NaN).
- `isBoolean(value)` — Checks if a value is a boolean.
- `isArray(value)` — Checks if a value is an array.
- `isObject(value)` — Checks if a value is a non-null object (not array).
- `isFunction(value)` — Checks if a value is a function.
- `isDate(value)` — Checks if a value is a valid Date object.
- `isNonEmptyString(str)` — Checks if a string is not empty after trimming.
- `isPositiveNumber(value)` — Checks if a value is a positive number.
- `isNonNegativeNumber(value)` — Checks if a value is a non-negative number.
- `isNonEmptyArray(arr)` — Checks if an array has items (type-safe).
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
- `getErrorMessage(error)` — Returns a user-friendly error message from an unknown error object.

## data/aggregation.ts — Utility Functions

- `calculateStats(numbers)` — Returns total, average, median, min, and max for an array of numbers.
- `countByField(items, field)` — Counts occurrences of each unique value for a given field in an array of objects.
- `sumBy(items, field)` — Sums the values of a specified field across an array of objects.
- `averageBy(items, field)` — Calculates the average of a specified field across an array of objects.
- `maxBy(items, field)` — Returns the object with the maximum value for a specified field.
- `minBy(items, field)` — Returns the object with the minimum value for a specified field.
- `groupSum(items, groupField, sumField)` — Sums a field for each group in an array of objects, grouped by another field.
- `groupAverage(items, groupField, avgField)` — Averages a field for each group in an array of objects, grouped by another field.
- `percentile(numbers, p)` — Returns the p-th percentile value from an array of numbers.
- `standardDeviation(numbers)` — Calculates the standard deviation of an array of numbers.
- `variance(numbers)` — Calculates the variance of an array of numbers.
- `mode(numbers)` — Returns the most frequent value(s) in an array of numbers.
- `frequency(items)` — Returns a Map of item frequencies for an array.

## data/enhancement.ts — Utility Functions

- `enrichWithRelations(entities, relations, options?)` — Enriches entities with related data from multiple sources, supporting one-to-one, one-to-many, and many-to-many relationships.
- `createRelationshipLookup(data, keyProperty, type?)` — Creates a lookup map for efficient relationship resolution, supporting single or multiple values per key.
- `enrichWithLookups(entities, lookups)` — Enriches entities using pre-built lookup maps for performance.
- `enrichWithComputedProperties(entities, computations)` — Adds computed/derived properties to entities based on custom logic.
- `flattenRelationships(entities, config)` — Flattens nested relationships into a single level, optionally prefixing property names.
- `groupByRelationship(entities, config)` — Groups entities by relationship values, supporting nested paths and transformations.
- `validateRelationshipIntegrity(entities, relationships)` — Validates relationship integrity, checking for orphaned records and missing relationships.

## data/processing.ts — Utility Functions

- `sortItems(items, key, direction?)` — Sorts an array of objects by a specified key and direction.
- `sortBy(items, criteria)` — Sorts an array of objects by multiple criteria (key and direction).
- `filterItems(items, filters)` — Filters an array of objects by multiple filter criteria (supports arrays, ranges, dates, booleans, and exact matches).
- `searchItems(items, query, searchFields)` — Searches an array of objects for a query string in specified fields (supports nested fields).
- `countByField(items, field)` — Counts occurrences of each unique value for a given field in an array of objects.
- `batchUpdateItems(items, updates)` — Batch-updates items in an array by id.
- `createCrudOps<T>()` — Returns an object with generic CRUD operations for arrays of objects with an `id` property.
- `filterByPredicate(items, predicate)` — Filters an array using a predicate function.

## data/sorting.ts — Utility Functions

- `sortGolfers(golfers, round?, isLiveRound?)` — Sorts golfers by position, score, and name, with support for live round and round-specific sorting.
- `sortTeams(teams, sortBy?, direction?)` — Sorts teams by score, earnings, or points in ascending or descending order.
- `sortByPosition(a, b)` — Compares two position strings (e.g., "T1", "2nd") numerically for sorting.
- `sortMultiple(items, sortFields)` — Sorts an array of objects by multiple fields, each with its own direction and type.
- `sortAlphabetically(a, b, caseSensitive?, direction?)` — Compares two strings alphabetically, with optional case sensitivity and direction.
- `sortByDate(a, b, direction?)` — Compares two dates for sorting in ascending or descending order.
- `sortByNumber(a, b, direction?)` — Compares two numbers for sorting in ascending or descending order.
- `shuffle(array)` — Returns a new array with the items shuffled in random order.

## data/transformation.ts — Utility Functions

- `filterItems(items, filters)` — Filters an array of objects by multiple filter criteria (supports arrays, ranges, date ranges, booleans, and exact matches).
- `searchItems(items, query, searchFields)` — Searches an array of objects for a query string in specified fields (supports nested fields).
- `batchUpdateItems(items, updates)` — Batch-updates items in an array by id.
- `mapItems(items, mapper)` — Transforms array items using a mapping function.
- `mapObjectValues(obj, mapper)` — Transforms object values while preserving keys.
- `transformNested(data, transformers)` — Recursively transforms nested object structure by applying functions at different levels.
- `flattenArray(items, depth?)` — Flattens nested array structure to a specified depth.
- `reshapeToNested(items, groupKeys)` — Reshapes an array of objects into a nested structure grouped by specified keys.
- `normalizeKeys(data, keyTransform)` — Normalizes data by converting keys to a consistent format.
- `arrayToTree(items, rootId?)` — Converts a flat array with parent-child relationships to a tree structure.
- `treeToArray(tree, levelKey?, level?)` — Converts a tree structure to a flat array with level indicators.

## domain/dates.ts — Utility Functions

- `subtractTimeFromDate({ date, weeksToSubtract, daysToSubtract, hoursToSubtract, minutesToSubtract })` — Subtracts weeks, days, hours, and minutes from a date.
- `addTimeToDate({ date, weeksToAdd, daysToAdd, hoursToAdd, minutesToAdd })` — Adds weeks, days, hours, and minutes to a date.
- `getDaysBetween(startDate, endDate)` — Returns the number of days between two dates.
- `getTournamentTimeline(tournaments, config?, referenceDate?)` — Returns a timeline object with current, previous, upcoming, past, future, thisWeek, and thisMonth tournaments.
- `getCurrentTournament(tournaments, preBuffer?, postBuffer?, referenceDate?)` — Returns the current tournament based on date and buffer days.
- `getPreviousTournament(tournaments, bufferDays?, referenceDate?)` — Returns the previous tournament based on date and buffer days.
- `getUpcomingTournament(tournaments, bufferDays?, referenceDate?)` — Returns the upcoming tournament based on date and buffer days.
- `sortTournamentsByStartDate(tournaments)` — Sorts tournaments by their start date.
- `isTournamentActive(tournament, referenceDate?)` — Checks if a tournament is currently active.
- `getTournamentsByYear(tournaments, year)` — Returns tournaments that start in a given year.
- `getTournamentsInDateRange(tournaments, startDate, endDate)` — Returns tournaments within a date range.
- `formatTournamentDateRange(startDate, endDate, location?)` — Formats a tournament date range for display, optionally including location.

## domain/formatting.ts — Utility Functions

- `formatNumber(n, maxFractionDigits?)` — Formats a number with localization and error handling.
- `formatCompactNumber(n)` — Formats a number in compact notation (e.g., 1.2K, 3.4M).
- `formatMoney(number, short?)` — Formats a monetary value with abbreviations for large amounts.
- `formatPercentage(value, asDecimal?)` — Formats a percentage with proper error handling.
- `formatRank(number)` — Formats an ordinal number (e.g., 1st, 2nd, 3rd).
- `formatTime(time)` — Formats a time value for display.
- `formatDate(date, format?)` — Formats a date value with configurable style.
- `formatName(name, type)` — Formats a name for display purposes (display or full).

## domain/golf.ts — Utility Functions

- `getGolferTeeTime(golfer)` — Gets the tee time for a golfer based on their current round.
- `getGolferRoundScore(golfer, round)` — Gets a specific round score for a golfer.
- `calculateTotalStrokes(golfer)` — Calculates the total strokes for a golfer across completed rounds.
- `getCompletedRounds(golfer)` — Gets the number of completed rounds for a golfer.
- `getScoringAverage(golfer, roundsPlayed?)` — Calculates scoring average for a golfer.
- `getPositionNumber(golfer)` — Gets the golfer's current position as a number.
- `hasMadeCut(golfer)` — Checks if a golfer has made the cut.
- `hasWithdrawn(golfer)` — Checks if a golfer has withdrawn.
- `isDisqualified(golfer)` — Checks if a golfer has been disqualified.
- `isTiedPosition(golfer)` — Checks if a golfer is in a tied position.
- `getTeamTeeTime(team)` — Gets the tee time for a team based on their current round.
- `getTournamentStatus(startDate, endDate, referenceDate?)` — Returns the tournament status ("upcoming", "current", or "completed").
- `getDaysUntilStart(startDate, referenceDate?)` — Calculates days until tournament start.
- `getCurrentRound(startDate, referenceDate?)` — Gets the current tournament round based on date.
- `formatScore(score)` — Formats a golf score with proper error handling.
- `formatThru(thru, teetime)` — Formats the "thru" value for golf rounds.

## domain/teams.ts — Utility Functions

- `enrichTeamsWithRelations(teams, relations, options?)` — Enriches teams with related data from members, scores, or other relations.
- `groupTeamsByProperty(teams, groupBy, transform?)` — Groups teams by a specified property (supports nested properties and key transformation).
- `filterTeamsByCriteria(teams, criteria, logic?)` — Filters teams based on multiple criteria with AND/OR logic.
- `sortTeamsByProperties(teams, sortConfig)` — Sorts teams by multiple properties with configurable direction and null handling.
- `calculateTeamStatistics(teams, config)` — Calculates team statistics (sum, average, min, max, count) from member or score data.

## domain/tournaments.ts — Utility Functions

- `getByStatus(tournaments, status)` — Filters tournaments by status ("upcoming", "current", or "completed").
- `getCurrentTournament(tournaments)` — Gets the current active tournament.
- `getNextTournament(tournaments)` — Gets the next upcoming tournament.
- `getPreviousTournament(tournaments)` — Gets the most recent completed tournament.
- `getUpcoming(tournaments)` — Gets all upcoming tournaments sorted by start date.
- `getCompleted(tournaments)` — Gets all completed tournaments sorted by end date (most recent first).
- `getBySeason(tournaments, seasonId)` — Filters tournaments by season ID.
- `getByDateRange(tournaments, startDate, endDate)` — Gets tournaments within a date range.
- `isLive(tournament)` — Checks if a tournament is currently live (active).
- `getByStatuses(tournaments, statuses)` — Gets tournaments matching any of the provided statuses.
- `sortTournaments(tournaments, field, direction?)` — Sorts tournaments by any field and direction.

## domain/validation.ts — Utility Functions

- `isValidEmail(email)` — Checks if a value is a valid email address.
- `isValidUrl(url)` — Checks if a value is a valid URL.
- `isValidTournamentDate(date)` — Checks if a date is valid for tournaments.
- `isValidTournamentStatus(status)` — Checks if a value is a valid tournament status.
- `validateMemberName(name)` — Checks if a member name is a valid string (min 3 chars).
- `validateRequiredData(dataArrays)` — Validates that required data arrays are not empty.
- `validateTournamentWindow(tournament, windowDays?)` — Validates tournament timing for display window.
- `validateChampionWindow(tournament)` — Validates tournament timing for champion display.
- `validateMemberForm(data)` — Validates member form data using Zod schema.
- `validatePaymentForm(data)` — Validates payment form data using Zod schema.
- `validateTournamentForm(data)` — Validates tournament form data using Zod schema.
- `getValidationErrors(schema, data)` — Returns validation errors for a Zod schema and data.

## system/api.ts — Utility Functions

- `fetchDataGolf(queryType, queryParameters?)` — Fetches data from the Data Golf API with error handling and query parameter support.
- `fetchWithRetry(url, options?, retries?)` — Fetch wrapper with exponential backoff retry logic for network resilience.
- `postData(url, data, options?)` — Type-safe POST request wrapper with JSON serialization and response parsing.
- `getData(url, params?, options?)` — Type-safe GET request with query parameter handling.
- `putData(url, data, options?)` — Type-safe PUT request wrapper for updating resources.
- `deleteData(url, options?)` — DELETE request wrapper with empty response handling.
- `isUrlReachable(url, timeout?)` — Checks if a URL is reachable within a timeout (useful for health checks).
- `downloadFile(url, filename)` — Client-side file download utility.
- `buildUrl(baseUrl, params?)` — Builds a URL with query parameters from an object.
- `parseResponseHeaders(response)` — Parses response headers into a plain object.
- `APIError` — Custom error class for API errors.

## system/caching.ts — Utility Functions

- `getCacheConfig(tournamentStatus, dataType?, options?)` — Returns optimized cache configuration based on tournament status and data type.
- `getPollingConfig(isLive, userPreference?)` — Returns polling configuration for live data with user-controlled intervals.
- `getSmartRefreshConfig(isUserActive, isLiveData)` — Returns refresh strategy considering user engagement and data liveness.
- `CACHE_TAGS` — Standardized cache key constants for consistent naming.
- `createCacheKey(type, id?)` — Creates standardized cache keys for caching.
- `logCacheStats(queryKey, action)` — Logs cache hits, misses, and fetches for development monitoring.
- `getCacheWarmingConfig()` — Returns cache config for preloading critical data.
- `getEmergencyRefreshConfig()` — Returns cache config for immediate refresh after critical updates.
- `SimpleCache<T>` — In-memory cache implementation for simple data with TTL and cleanup support.

## system/performance.ts — Utility Functions

- `measurePerformance(name, fn, iterations?)` — Measures synchronous function execution time and averages over multiple iterations.
- `measureAsyncPerformance(name, fn, iterations?)` — Measures async function execution time and averages over multiple iterations.
- `timeExecution(fn)` — Simple wrapper to measure execution time of a function.
- `timeAsyncExecution(fn)` — Simple wrapper to measure execution time of an async function.
- `startProfile(name, tags?)` — Starts a named performance profile (with optional tags).
- `endProfile(name)` — Ends a named performance profile and returns results.
- `getActiveProfiles()` — Returns all currently active performance profiles.
- `clearProfiles()` — Clears all active performance profiles.
- `getMemoryInfo()` — Returns current JS heap memory usage (Chrome/Edge only).
- `logMemoryUsage()` — Logs current memory usage to the console.
- `benchmark(name, functions, iterations?)` — Compares performance of multiple functions and reports fastest/slowest.
- `debounce(func, wait)` — Debounces a function for performance optimization.
- `throttle(func, limit)` — Throttles a function for performance optimization.
- `memoize(func, getKey?)` — Memoizes a function for performance optimization.
- `createDelay(ms)` — Returns a promise that resolves after a delay.
- `batchCalls(func, delay?)` — Batches function calls for improved performance.

## system/queries.ts — Utility Functions

- `getOptimizedQueryConfig(isHighFrequency, customOptions?)` — Returns query config optimized for high/low frequency data.
- `getFrequencyBasedQueryConfig(frequency, customOptions?)` — Returns query config based on data update frequency ("high", "medium", "low", "static").
- `getContextBasedQueryConfig(context, customOptions?)` — Returns query config for specific usage contexts (tournament, leaderboard, stats, background).
- `getTournamentStatusQueryConfig(tournamentStatus, customOptions?)` — Returns query config based on tournament status ("upcoming", "current", "completed").
- `getPerformanceOptimizedQueryConfig(customOptions?)` — Returns config for performance-sensitive queries.
- `getDevelopmentQueryConfig(customOptions?)` — Returns config for development/testing with aggressive refetching.
- `createQueryConfig(options)` — Creates a query config based on frequency, context, tournament status, and custom options.
- `validateQueryConfig(config)` — Validates and corrects query config values to be within reasonable bounds.

## system/storage.ts — Utility Functions

- `setStorageItem(key, value, type?, options?)` — Sets an item in localStorage or sessionStorage with error handling and serialization.
- `getStorageItem(key, type?, options?)` — Gets an item from storage with error handling and deserialization.
- `removeStorageItem(key, type?, options?)` — Removes an item from storage.
- `hasStorageItem(key, type?)` — Checks if a key exists in storage.
- `getStorageSize(type?)` — Gets the approximate size of storage in bytes.
- `getStorageItemSize(key, type?)` — Gets the size of a specific storage item in bytes.
- `isApproachingQuota(type?, threshold?)` — Checks if storage is approaching quota (default 80%).
- `getStorageStats(type?)` — Gets comprehensive storage statistics (size, count, largest item, quota usage).
- `clearNonEssentialStorage(keepKeys?, type?)` — Clears storage except for essential keys.
- `logStorageUsage(type?)` — Logs storage usage for debugging.
- `createStorageManager(prefix, type?)` — Creates a storage manager for a key prefix with set/get/remove/has/clear/getStats methods.

## constants.ts — Application Constants

- `MAX_PAYOUTS_DISPLAY` — Maximum number of payouts/points to display in tournament popover.
- `YARDAGE_PRECISION` — Precision for yardage and numeric display (decimal places).
- `HOLES_PER_ROUND` — Standard number of holes in a golf round.
- `MAX_GOLF_SCORE` — Maximum reasonable golf score for validation.
- `MIN_GOLF_SCORE` — Minimum reasonable golf score for validation.
- `DEFAULT_TOURNAMENT_BUFFER` — Default tournament buffer days for timeline calculations.

---

## Suggestions for Consolidation and Reducing Overlap

After reviewing the utility functions, here are some areas where consolidation and refactoring could reduce duplication and improve maintainability:

### 1. Filtering, Searching, and Grouping

- **filterItems** appears in both `data/processing.ts` and `data/transformation.ts` with similar logic. Consider consolidating into a single, more flexible function that supports both shallow and nested property filtering, and allows for custom operators via an options object.
- **searchItems** is also duplicated. A single implementation supporting nested fields and customizable search logic would suffice.
- **groupBy** and **groupTeamsByProperty** (and similar grouping functions) could be unified into a generic `groupBy` that supports nested keys and key transformation via options.

### 2. Sorting

- **sortItems**, **sortBy**, **sortMultiple**, **sortTeamsByProperties**, and **sortTeams** all perform multi-field or single-field sorting. These could be merged into a single, highly-configurable `sortBy` utility that accepts an array of sort criteria, supports nested keys, direction, and null handling via options.

### 3. CRUD and Batch Operations

- **createCrudOps** appears in multiple modules. Consider a single generic CRUD factory that can be imported from a central location.
- **batchUpdateItems** is duplicated; a single implementation is sufficient.

### 4. Array Utilities

- **flatten** and **flattenArray** can be merged, with an option for depth.
- **count** and **countByField** are similar; a single function with a key selector or field name parameter can cover both.

### 5. Object Utilities

- **mapObject** and **mapObjectValues** can be unified.
- **filterObject** is implemented in multiple places; a single, generic version is sufficient.

### 6. Type Guards and Validation

- **isValidEmail**, **isValidUrl**, **isValidTournamentDate**, and **isValidTournamentStatus** are present in both core and domain/validation. Consider centralizing these in one module and re-exporting as needed.
- **hasProperty** and **isKeyOf** are similar; clarify their distinct use cases or merge if possible.

### 7. Formatting

- **formatNumber**, **formatCompactNumber**, **formatMoney**, **formatPercentage** could be consolidated into a single `formatNumber` utility with options for style, compactness, currency, and percent.

### 8. Storage and Caching

- Storage and caching utilities are well-separated, but consider a shared interface for cache/storage managers to unify set/get/remove/clear/statistics methods.

### 9. General Recommendations

- Where functions differ only by a small behavior (e.g., shallow vs deep, strict vs loose), prefer a single function with an options object to control the behavior.
- Use TypeScript generics and utility types to maximize code reuse and type safety.
- Document the preferred import path for each consolidated utility to avoid confusion.

**Next Steps:**

- Identify the most-used variants of each utility and refactor towards a single, flexible implementation.
- Update documentation and usage examples to reflect the new, consolidated APIs.
- Deprecate or alias old function names to ease migration.

---
