# Tournament Hooks - Comprehensive Documentation

## Overview

The `useTournamentHooks.tsx` file provides a complete, type-safe, and efficient set of hooks for working with tournament data in the golf tournament application. This refactored solution eliminates all `any` types, uses proper `MinimalTournament` types matching the seasonal store and database schema, and provides comprehensive functionality for tournament data management.

## Features

- **Type Safety**: Uses proper `MinimalTournament` types with no `any` types
- **Performance**: Memoized selectors and efficient data processing
- **Error Handling**: Comprehensive error and loading state management
- **Filtering & Sorting**: Advanced filtering, sorting, and grouping capabilities
- **Search**: Built-in search functionality
- **Pagination**: Support for paginated historical data
- **Statistics**: Tournament analytics and statistics
- **Comprehensive**: Covers all tournament data manipulation needs

## Architecture

### Base Hook

- `useProcessedTournaments()`: Internal base hook that handles raw data processing, error handling, and loading states

### Specific Tournament Hooks

- `useCurrentTournament()`: Returns the currently active tournament
- `useLastTournament()`: Returns the most recently completed tournament (within 3 days)
- `useNextTournament()`: Returns the next upcoming tournament
- `usePreviousTournament()`: Returns the tournament before the last completed one

### Collection Hooks

- `useSeasonTournaments()`: Returns all tournaments with filtering and sorting
- `useTournamentsByStatus()`: Groups tournaments by status (upcoming, current, completed)
- `useTournamentsByTier()`: Groups tournaments by tier
- `useHistoricalTournaments()`: Paginated historical tournaments

### Utility Hooks

- `useTournamentStats()`: Comprehensive tournament statistics
- `useSearchTournaments()`: Search tournaments by name or course
- `useTournamentById()`: Retrieve a specific tournament by ID

### Advanced Utility Hooks

- `useTournamentsInDateRange()`: Tournaments within date range
- `useUpcomingTournamentsInDays()`: Upcoming tournaments in next N days
- `useTournamentsByTierId()`: Tournaments for specific tier
- `useTournamentsByCourseId()`: Tournaments for specific course
- `useAllTournamentData()`: All tournament data in a single call

## Types

### MinimalTournament

```typescript
type MinimalTournament = {
  id: string;
  name: string;
  logoUrl: string | null;
  startDate: Date;
  endDate: Date;
  livePlay: boolean | null;
  currentRound: number | null;
  seasonId: string;
  courseId: string;
  tierId: string;
  course: {
    id: string;
    name: string;
    location: string;
    par: number;
    apiId: string;
  };
  tier: {
    id: string;
    name: string;
    seasonId: string;
  };
};
```

### TournamentFilters

```typescript
interface TournamentFilters {
  status?: TournamentStatus | TournamentStatus[];
  tierIds?: string[];
  courseIds?: string[];
  dateRange?: { start: Date; end: Date };
  search?: string;
}
```

### TournamentHookResult

```typescript
interface TournamentHookResult {
  tournaments: MinimalTournament[];
  isLoading: boolean;
  error: string | null;
  count: number;
}
```

## Usage Examples

### Basic Usage

```typescript
// Get current tournament
const currentTournament = useCurrentTournament();

// Get next tournament
const nextTournament = useNextTournament();

// Get all tournaments with basic filtering
const { tournaments, isLoading, error } = useSeasonTournaments();
```

### Advanced Filtering

```typescript
// Filter tournaments by status and tier
const { tournaments } = useSeasonTournaments(
  {
    status: ["upcoming", "current"],
    tierIds: ["tier-1", "tier-2"],
  },
  "startDate",
  "asc",
);

// Search tournaments
const searchResults = useSearchTournaments(
  "masters",
  { status: "completed" },
  "endDate",
  "desc",
);
```

### Grouped Data

```typescript
// Group by status
const { upcoming, current, completed } = useTournamentsByStatus();

// Group by tier
const { byTier, tiers } = useTournamentsByTier();
```

### Pagination

```typescript
// Historical tournaments with pagination
const { tournaments, totalPages, hasNext, hasPrevious } =
  useHistoricalTournaments(1, 10, { search: "pga" });
```

### Statistics

```typescript
// Get comprehensive stats
const { total, upcoming, current, completed, byTier, byCourse } =
  useTournamentStats();
```

### All-in-One Hook

```typescript
// Get everything in one call
const {
  all,
  current,
  next,
  last,
  previous,
  byStatus,
  byTier,
  stats,
  isLoading,
  error,
} = useAllTournamentData();
```

## Utility Functions

### processRawTournaments()

Converts raw tournament data from the store to properly typed tournaments with Date objects.

### filterTournaments()

Applies comprehensive filtering based on status, tier IDs, course IDs, date ranges, and search terms.

### sortTournaments()

Sorts tournaments by specified criteria (startDate, endDate, name, tier) in ascending or descending order.

### calculateTournamentStats()

Calculates comprehensive statistics including counts by status, tier, and course.

## Error Handling

All hooks provide consistent error handling:

- Loading states when data is being fetched
- Error messages for various failure scenarios
- Graceful fallbacks with empty arrays/undefined values
- Type-safe error propagation

## Performance Optimizations

- **Memoization**: All hooks use `useMemo` for expensive computations
- **Selective Dependencies**: Minimal dependency arrays to prevent unnecessary re-renders
- **Efficient Filtering**: Single-pass filtering and sorting operations
- **Lazy Evaluation**: Complex calculations only when data changes

## Best Practices

1. **Use Specific Hooks**: Prefer specific hooks (`useCurrentTournament`) over generic ones when possible
2. **Memoize Dependencies**: When passing filters or options, memoize them to prevent unnecessary re-computations
3. **Handle Loading States**: Always check `isLoading` before using tournament data
4. **Error Boundaries**: Implement error boundaries for components using these hooks
5. **Type Safety**: Leverage TypeScript's type checking - avoid type assertions

## Migration from Old Hooks

The old tournament hooks have been completely replaced. Key changes:

- **Type Safety**: No more `any` types - all functions use proper types
- **Comprehensive API**: Single file covers all tournament needs
- **Consistent Interface**: All hooks follow the same patterns
- **Better Performance**: Optimized with proper memoization
- **Enhanced Features**: More filtering, sorting, and utility options

## Dependencies

- `useSeasonalStore`: Zustand store for tournament data
- `@/lib/utils`: Refactored utility functions for golf, dates, processing
- `@/lib/utils/core/*`: Core utility functions for arrays, objects, types
- `react`: React hooks (useMemo)

## Testing Considerations

When testing components that use these hooks:

1. Mock the `useSeasonalStore` with appropriate test data
2. Test loading and error states
3. Verify filtering and sorting behavior
4. Test edge cases (empty data, invalid IDs, etc.)
5. Ensure proper memoization behavior

## Future Enhancements

Potential areas for future improvement:

- Debounced search functionality
- Caching strategies for expensive calculations
- Real-time updates integration
- Advanced analytics and metrics
- Export/import functionality
- Tournament comparison utilities
