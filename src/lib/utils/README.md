# Golf Tournament Utilities

A comprehensive collection of utility functions for golf tournament management, data formatting, validation, and manipulation.

## Core Functions

### 🎨 **Styling & Classes**

- `cn(...inputs)` - Combines class names with Tailwind CSS merge functionality
- `clsx` - Re-exported for direct use (conditional class names)

## Modules

### 🎨 Formatting (`formatting.ts`)

- `formatNumber(n, maxFractionDigits?)` - Formats numbers with proper error handling
- `formatCompactNumber(n)` - Formats numbers in compact notation (1.2K, 3.4M)
- `formatMoney(number, short?)` - Formats monetary values with abbreviations
- `formatScore(score)` - Formats golf scores with +/- and E notation
- `formatThru(thru, teetime)` - Formats holes completed or tee time
- `formatPercentage(value, asDecimal?)` - Formats percentages with proper handling
- `formatRank(number)` - Formats ordinal numbers (1st, 2nd, 3rd, etc.)
- `formatTime(time)` - Formats time in 12-hour format
- `formatDate(date, format?)` - Formats dates with various styles
- `safeNumber(value, fallback?)` - Safely converts values to numbers

### ✅ Validation (`validation.ts`)

- `isValidGolfScore(score)` - Validates golf scores (-40 to 99 range)
- `isValidHole(hole)` - Validates hole numbers (1-18)
- `isValidRound(round)` - Validates round numbers (1-4)
- `isNonEmptyString(str)` - Checks for non-empty strings
- `isValidEmail(email)` - Validates email format
- `isValidUrl(url)` - Validates URL format
- `isValidTournamentDate(date)` - Validates tournament dates
- `isPositiveNumber(value)` - Checks for positive numbers
- `isNonNegativeNumber(value)` - Checks for non-negative numbers
- `isInRange(value, min, max)` - Validates number ranges
- `hasItems(arr)` - Checks if array has items
- `isValidTournamentStatus(status)` - Validates tournament status
- `isDefined(value)` - Type guard for defined values
- `isNullish(value)` - Type guard for null/undefined

### 🔄 Sorting (`sorting.ts`)

- `sortGolfers(golfers, round?, isLiveRound?)` - Comprehensive golfer sorting
- `sortTeams(teams, sortBy?, direction?)` - Sorts teams by various metrics
- `sortByDate(a, b, direction?)` - Date comparison for sorting
- `sortByPosition(a, b)` - Position string sorting (handles T, ordinals)
- `sortByScore(a, b)` - Score comparison for sorting
- `sortByNumber(a, b, direction?)` - Number comparison with direction
- `sortAlphabetically(a, b, caseSensitive?, direction?)` - String sorting
- `sortMultiple(items, sortFields)` - Multi-field sorting
- `shuffle(array)` - Randomly shuffles array (Fisher-Yates)

### 📅 Dates (`dates.ts`)

- `subtractTimeFromDate(options)` - Subtracts time from dates
- `addTimeToDate(options)` - Adds time to dates
- `getStartOfDay(date)` - Gets start of day (00:00:00)
- `getEndOfDay(date)` - Gets end of day (23:59:59)
- `isSameDay(date1, date2)` - Checks if dates are same day
- `getDaysBetween(start, end)` - Calculates days between dates
- `getTournamentTimeline(tournaments, config?, referenceDate?)` - Tournament categorization
- `tournamentUtils.*` - Quick tournament utility functions

### ⛳ Golf (`golf.ts`)

- `getGolferTeeTime(golfer)` - Gets golfer's current round tee time
- `getTeamTeeTime(team)` - Gets team's current round tee time
- `getGolferRoundScore(golfer, round)` - Gets specific round score
- `getGolferRoundTeeTime(golfer, round)` - Gets specific round tee time
- `calculateTotalStrokes(golfer)` - Calculates total strokes
- `getCompletedRounds(golfer)` - Gets number of completed rounds
- `hasMadeCut(golfer)` - Checks if golfer made the cut
- `hasWithdrawn(golfer)` - Checks if golfer withdrew
- `isDisqualified(golfer)` - Checks if golfer was disqualified
- `getPositionNumber(golfer)` - Gets numeric position
- `isTiedPosition(golfer)` - Checks for tied positions
- `getScoringAverage(golfer, roundsPlayed?)` - Calculates scoring average
- `getTournamentStatus(start, end, reference?)` - Gets tournament status
- `getDaysUntilStart(start, reference?)` - Days until tournament start
- `getCurrentRound(start, reference?)` - Gets current tournament round

### 📝 Strings (`strings.ts`)

- `slugify(input)` - Converts to URL-friendly slug
- `formatName(name, type)` - Formats names for display
- `capitalize(str)` - Capitalizes first letter
- `titleCase(str)` - Converts to title case
- `truncate(str, maxLength, suffix?)` - Truncates with ellipsis
- `cleanWhitespace(str)` - Normalizes whitespace
- `getInitials(name, maxInitials?)` - Extracts initials
- `camelToKebab(str)` - Converts camelCase to kebab-case
- `kebabToCamel(str)` - Converts kebab-case to camelCase
- `isAlphanumeric(str)` - Checks alphanumeric characters
- `pluralize(word, count, pluralForm?)` - Simple pluralization
- `escapeHtml(str)` - Escapes HTML special characters
- `randomString(length, charset?)` - Generates random strings

### 📋 Arrays (`arrays.ts`)

- `groupBy(array, keyFn)` - Groups array items by key
- `unique(array, keyFn?)` - Removes duplicates
- `chunk(array, size)` - Splits array into chunks
- `flatten(array)` - Flattens nested arrays
- `intersection(array1, array2, keyFn?)` - Finds common items
- `difference(array1, array2, keyFn?)` - Finds different items
- `sample(array)` - Gets random item
- `sampleSize(array, count)` - Gets multiple random items
- `partition(array, predicate)` - Splits array by condition
- `keyBy(array, keyFn, valueFn?)` - Creates object from array
- `pick(obj, keys)` - Picks object properties
- `omit(obj, keys)` - Omits object properties
- `deepClone(obj)` - Deep clones objects/arrays
- `deepMerge(target, source)` - Deep merges objects
- `isEmpty(obj)` - Checks if object is empty
- `get(obj, path, defaultValue?)` - Safe nested property access

### 🌐 API (`api.ts`)

- `fetchDataGolf(queryType, queryParameters?)` - Data Golf API wrapper
- `fetchWithRetry(url, options?, retries?)` - Fetch with retry logic
- `postData(url, data, options?)` - Type-safe POST requests
- `getData(url, params?, options?)` - GET requests with query params
- `putData(url, data, options?)` - PUT request wrapper
- `deleteData(url, options?)` - DELETE request wrapper
- `isUrlReachable(url, timeout?)` - Checks URL availability
- `downloadFile(url, filename)` - Downloads files from URLs

## Usage Examples

```typescript
// Import specific functions
import { formatMoney, sortGolfers, isValidGolfScore } from "@/lib/utils";

// Import entire modules for organized code
import { formatting, validation, golf } from "@/lib/utils";

// Format a monetary value
const prize = formatMoney(1234567); // "$1.2M"

// Sort golfers by position and score
const sorted = sortGolfers(golfers, 2, true); // Sort by round 2, live scoring

// Validate a golf score
if (isValidGolfScore(score)) {
  // Process valid score
}

// Get tournament timeline
const timeline = getTournamentTimeline(tournaments, {
  preStartBuffer: 3,
  postEndBuffer: 1,
});

// Format player name
const displayName = formatName("john doe", "display"); // "J. Doe"
```

## Features

- 🛡️ **Type Safe**: Full TypeScript support with proper type guards
- 🚨 **Error Proof**: Comprehensive error handling and validation
- 📚 **Well Documented**: JSDoc comments with examples for all functions
- 🎯 **Golf Specific**: Specialized utilities for golf tournaments and scoring
- 🔧 **Modular**: Organized into logical modules for easy importing
- ⚡ **Performance**: Optimized for common use cases
- 🧪 **Tested**: Robust validation and edge case handling
