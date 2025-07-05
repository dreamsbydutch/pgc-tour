# Tour Card & Member Hooks - Comprehensive Documentation

## Overview

The `useTourCardHooks_new.tsx` file provides a complete, type-safe, and efficient set of hooks for working with tour cards, members, and friends data in the golf tournament application. This comprehensive solution handles current season data, member relationships, friend management, and analytics.

## Features

- **Type Safety**: Uses proper `MinimalTourCard`, `MinimalMember` types with no `any` types
- **Performance**: Memoized selectors and efficient data processing
- **Error Handling**: Comprehensive error and loading state management
- **Tour Card Management**: Filtering, sorting, grouping, and analytics
- **Member Management**: Member data access and friend relationships
- **Friend System**: Friend management and relationship queries
- **Statistics**: Comprehensive analytics for tour cards and members
- **Search**: Built-in search functionality for both tour cards and members

## Architecture

### Base Hooks
- `useProcessedTourCards()`: Internal base hook for tour card data processing
- `useProcessedMembers()`: Internal base hook for member data processing

### Tour Card Hooks
- `useCurrentTourCards()`: Returns current season tour cards
- `useTourCards()`: Returns tour cards with filtering and sorting
- `useTourCardsByMember()`: Tour cards for a specific member
- `useTourCardsByTour()`: Tour cards for a specific tour
- `useTourCardsByTourGrouped()`: Tour cards grouped by tour
- `useTourCardsByMemberGrouped()`: Tour cards grouped by member
- `useTourCardById()`: Retrieve specific tour card by ID

### Member Hooks
- `useCurrentMember()`: Returns the current member
- `useMembers()`: Returns members with filtering
- `useMemberById()`: Retrieve specific member by ID

### Friend Hooks
- `useCurrentMemberFriends()`: Returns current member's friends
- `useMemberFriends()`: Returns friends of a specific member
- `useAreFriends()`: Checks if two members are friends

### Statistics Hooks
- `useTourCardStats()`: Comprehensive tour card statistics
- `useMemberStats()`: Comprehensive member statistics

### Search Hooks
- `useSearchTourCards()`: Search tour cards by name, member, or tour
- `useSearchMembers()`: Search members by name or email

### Combined Hooks
- `useAllTourCardAndMemberData()`: All data in a single call

## Types

### EnhancedTourCard
```typescript
type EnhancedTourCard = MinimalTourCard & {
  tour: MinimalTour;
  member: MinimalMember;
  season: { id: string; year: number; number: number };
};
```

### TourCardFilters
```typescript
interface TourCardFilters {
  tourIds?: string[];
  memberIds?: string[];
  seasonIds?: string[];
  earnings?: { min?: number; max?: number };
  points?: { min?: number; max?: number };
  hasEarnings?: boolean;
  hasPosition?: boolean;
  search?: string;
}
```

### MemberFilters
```typescript
interface MemberFilters {
  roles?: string[];
  hasAccount?: boolean;
  hasFriends?: boolean;
  search?: string;
}
```

### TourCardStats
```typescript
interface TourCardStats {
  total: number;
  totalEarnings: number;
  totalPoints: number;
  avgEarnings: number;
  avgPoints: number;
  byTour: Record<string, number>;
  byMember: Record<string, number>;
  withPosition: number;
  withEarnings: number;
  topEarners: EnhancedTourCard[];
  topPointsScorers: EnhancedTourCard[];
}
```

## Usage Examples

### Basic Tour Card Usage

```typescript
// Get current tour cards
const tourCards = useCurrentTourCards();

// Get tour cards with filtering
const { tourCards, isLoading, error } = useTourCards(
  {
    earnings: { min: 1000 },
    hasPosition: true
  },
  "earnings",
  "desc"
);

// Get tour cards for a specific member
const memberTourCards = useTourCardsByMember("member-id");
```

### Advanced Tour Card Filtering

```typescript
// Complex filtering
const { tourCards } = useTourCards({
  tourIds: ["tour-1", "tour-2"],
  earnings: { min: 500, max: 10000 },
  hasEarnings: true,
  search: "john"
}, "points", "desc");

// Group by tour
const { byTour, tours } = useTourCardsByTourGrouped();

// Group by member
const { byMember, members } = useTourCardsByMemberGrouped();
```

### Member Management

```typescript
// Get current member
const currentMember = useCurrentMember();

// Get members with filtering
const { members } = useMembers({
  roles: ["admin", "regular"],
  hasAccount: true,
  search: "john@example.com"
});

// Get specific member
const { member, isLoading, error } = useMemberById("member-id");
```

### Friend Management

```typescript
// Get current member's friends
const { friends, friendCount } = useCurrentMemberFriends();

// Get friends of a specific member
const { friends, friendCount } = useMemberFriends("member-id");

// Check if two members are friends
const { areFriends, isLoading } = useAreFriends("member-1", "member-2");
```

### Statistics and Analytics

```typescript
// Tour card statistics
const {
  total,
  totalEarnings,
  avgEarnings,
  topEarners,
  byTour
} = useTourCardStats();

// Member statistics
const {
  total,
  totalFriends,
  avgFriendsPerMember,
  byRole,
  totalAccountValue
} = useMemberStats();
```

### Search Functionality

```typescript
// Search tour cards
const searchResults = useSearchTourCards(
  "masters",
  { hasEarnings: true },
  "earnings",
  "desc"
);

// Search members
const memberResults = useSearchMembers(
  "john",
  { roles: ["regular"] }
);
```

### All-in-One Hook

```typescript
// Get everything in one call
const {
  tourCards,
  tourCardsByTour,
  tourCardsByMember,
  tourCardStats,
  members,
  currentMember,
  memberStats,
  currentFriends,
  isLoading,
  error,
  counts
} = useAllTourCardAndMemberData();
```

## Utility Functions

### enhanceTourCards()
Combines tour card data with tour, member, and season information for a complete data structure.

### filterTourCards()
Applies comprehensive filtering based on tours, members, seasons, earnings, points, and search terms.

### filterMembers()
Filters members based on roles, account status, friends, and search terms.

### sortTourCards()
Sorts tour cards by earnings, points, position, display name, appearances, wins, or top tens.

### calculateTourCardStats()
Calculates comprehensive statistics including totals, averages, distributions, and top performers.

### calculateMemberStats()
Calculates member statistics including totals, friend counts, role distributions, and account values.

## Error Handling

All hooks provide consistent error handling:
- Loading states when data is being fetched
- Error messages for various failure scenarios
- Graceful fallbacks with empty arrays/null values
- Type-safe error propagation

## Performance Optimizations

- **Memoization**: All hooks use `useMemo` for expensive computations
- **Selective Dependencies**: Minimal dependency arrays to prevent unnecessary re-renders
- **Efficient Processing**: Single-pass filtering and sorting operations
- **Lazy Evaluation**: Complex calculations only when data changes

## Data Relationships

### Tour Card Relationships
- **Tour Cards → Tours**: Each tour card belongs to a specific tour
- **Tour Cards → Members**: Each tour card belongs to a specific member
- **Tour Cards → Seasons**: Each tour card belongs to a specific season

### Member Relationships
- **Members → Friends**: Members maintain a list of friend IDs
- **Members → Tour Cards**: Members can have multiple tour cards across seasons
- **Members → Account**: Members have account balances

### Friend System
- **Bidirectional**: Friendship is bidirectional (both members must have each other as friends)
- **String Arrays**: Friends are stored as arrays of member IDs
- **Validation**: Helper hooks check friendship status between members

## Best Practices

1. **Use Specific Hooks**: Prefer specific hooks (`useTourCardsByMember`) over generic ones when possible
2. **Memoize Dependencies**: When passing filters or options, memoize them to prevent re-computations
3. **Handle Loading States**: Always check `isLoading` before using data
4. **Error Boundaries**: Implement error boundaries for components using these hooks
5. **Type Safety**: Leverage TypeScript's type checking - avoid type assertions
6. **Friend Management**: Use the provided friend hooks rather than direct data manipulation

## Current Limitations

### Data Scope
- **Single Member**: Currently only works with the current member from the store
- **Current Season**: Primarily focused on current season data
- **Limited Historical**: No historical season data support yet

### Future Enhancements
- **Multi-Member Support**: Support for all members in the system
- **Historical Data**: Tour cards and member data across multiple seasons
- **Friend Discovery**: Hooks for finding potential friends
- **Advanced Analytics**: More sophisticated statistics and comparisons
- **Real-time Updates**: Live data updates for tour cards and member changes

## Integration with Store

The hooks integrate with the seasonal store (`useSeasonalStore`) to access:
- `allTourCards`: Current season tour cards
- `tours`: Available tours for the season
- `season`: Current season information
- `member`: Current authenticated member

## Testing Considerations

When testing components that use these hooks:
1. Mock the `useSeasonalStore` with appropriate test data
2. Test loading and error states
3. Verify filtering and sorting behavior
4. Test friend relationship logic
5. Ensure proper memoization behavior
6. Test edge cases (empty data, invalid IDs, etc.)

## Migration Guide

If migrating from the old `useTourCardHooks.tsx`:

### Old Hook
```typescript
const tourCards = useCurrentTourCards();
```

### New Hook
```typescript
const tourCards = useCurrentTourCards(); // Same interface, enhanced data
```

### Enhanced Features
```typescript
// Now available with the new hooks
const filtered = useTourCards({ earnings: { min: 1000 } });
const stats = useTourCardStats();
const friends = useCurrentMemberFriends();
```

The new hooks are backward compatible while providing significantly more functionality.
