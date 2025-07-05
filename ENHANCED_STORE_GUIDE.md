# Enhanced Seasonal Store Documentation

The enhanced seasonal store is now a comprehensive solution for managing all seasonal data with advanced CRUD operations, filtering, sorting, and computed values. This document provides a complete guide to using all the new features.

## Table of Contents

- [Core Features](#core-features)
- [Data Types](#data-types)
- [CRUD Operations](#crud-operations)
- [Advanced Filtering](#advanced-filtering)
- [Sorting and Querying](#sorting-and-querying)
- [Computed Values](#computed-values)
- [Convenience Hooks](#convenience-hooks)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Core Features

### ✅ Complete CRUD Operations

- **Create**: Add new tournaments, tours, tour cards, and tiers
- **Read**: Get individual items, filtered lists, and computed data
- **Update**: Modify existing data with type-safe updates
- **Delete**: Remove items with proper cleanup

### ✅ Advanced Filtering

- Filter tournaments by status, tier, course, or date range
- Filter tour cards by earnings, points, or activity level
- Combine multiple filters for precise data selection

### ✅ Sorting and Search

- Sort tour cards by any field with ascending/descending order
- Search across tournaments, tour cards, tours, and tiers
- Full-text search with partial matching

### ✅ Computed Values

- Real-time leaderboards and standings
- Statistical distributions and analytics
- Tournament and member counts by various groupings

### ✅ Batch Operations

- Update multiple records in a single operation
- Optimized for performance with large datasets

### ✅ Data Validation

- Built-in validation for data integrity
- Health checks and error reporting
- Data size monitoring and quota management

## Data Types

### Minimal Types (Optimized for Storage)

```typescript
type MinimalCourse = Pick<Course, "id" | "name" | "location" | "par" | "apiId">;
type MinimalTier = Pick<Tier, "id" | "name" | "seasonId">;
type MinimalTour = Pick<
  Tour,
  "id" | "name" | "logoUrl" | "buyIn" | "shortForm"
>;
type MinimalTourCard = Pick<
  TourCard,
  | "id"
  | "memberId"
  | "tourId"
  | "seasonId"
  | "displayName"
  | "earnings"
  | "points"
  | "position"
>;
type MinimalTournament = Pick<
  Tournament,
  | "id"
  | "name"
  | "logoUrl"
  | "startDate"
  | "endDate"
  | "livePlay"
  | "currentRound"
  | "seasonId"
  | "courseId"
  | "tierId"
> & {
  course: MinimalCourse;
  tier: MinimalTier;
};
```

### Filter Types

```typescript
type TournamentFilters = {
  status?: TournamentStatus[];
  tierIds?: string[];
  courseIds?: string[];
  dateRange?: { start: Date; end: Date };
};

type TourCardFilters = {
  tourIds?: string[];
  minEarnings?: number;
  maxEarnings?: number;
  minPoints?: number;
  maxPoints?: number;
  hasEarnings?: boolean;
};
```

## CRUD Operations

### Tournament Operations

```typescript
// Get tournaments
const tournament = getTournament(id);
const currentTournament = getCurrentTournament();
const upcomingTournaments = getUpcomingTournaments();
const pastTournaments = getPastTournaments();

// Update tournament
updateTournament(id, { name: "New Name", livePlay: true });

// Add new tournament
addTournament({
  id: "new-tournament",
  name: "New Tournament",
  startDate: new Date(),
  endDate: new Date(),
  // ... other fields
});

// Remove tournament
removeTournament(id);
```

### Tour Card Operations

```typescript
// Get tour cards
const tourCard = getTourCard(id);
const memberTourCard = getTourCardByMember(memberId);
const tourCards = getTourCardsByTour(tourId);
const topEarners = getTopEarners(10);
const leaderboard = getLeaderboard();

// Update tour card
updateTourCard(id, { earnings: 5000, points: 100 });

// Batch update
batchUpdateTourCards([
  { id: "card1", updates: { earnings: 1000 } },
  { id: "card2", updates: { points: 50 } },
]);

// Add/remove tour cards
addTourCard(newTourCard);
removeTourCard(id);
```

### Tour Operations

```typescript
// Get tours
const tour = getTour(id);
const tours = getToursById([id1, id2]);
const allTours = getAllTours();

// Update tour
updateTour(id, { buyIn: 150, name: "Updated Name" });

// Add/remove tours
addTour(newTour);
removeTour(id);
```

### Tier Operations

```typescript
// Get tiers
const tier = getTier(id);
const allTiers = getAllTiers();

// Update tier
updateTier(id, { name: "New Tier Name" });

// Add/remove tiers
addTier(newTier);
removeTier(id);
```

## Advanced Filtering

### Tournament Filtering

```typescript
// Filter by status
const upcomingTournaments = filterTournaments({
  status: ["upcoming"],
});

// Filter by tier and date range
const filteredTournaments = filterTournaments({
  tierIds: ["tier1", "tier2"],
  dateRange: {
    start: new Date("2024-01-01"),
    end: new Date("2024-12-31"),
  },
});

// Get tournaments by specific criteria
const tournamentsByStatus = getTournamentsByStatus("current");
const tournamentsByCourse = getTournamentsByCourse(courseId);
const tournamentsInRange = getTournamentsInDateRange(startDate, endDate);
```

### Tour Card Filtering

```typescript
// Filter by earnings range
const highEarners = filterTourCards({
  minEarnings: 10000,
  maxEarnings: 50000,
});

// Filter active members only
const activeMembers = filterTourCards({
  hasEarnings: true,
});

// Get by earnings range
const earningsRange = getTourCardsByEarningsRange(1000, 10000);
const activeTourCards = getActiveTourCards();
const inactiveTourCards = getInactiveTourCards();
```

## Sorting and Querying

### Sorting

```typescript
// Sort tour cards by any field
const sortedByEarnings = sortTourCards("earnings", "desc");
const sortedByName = sortTourCards("displayName", "asc");
const sortedByPoints = sortTourCards("points", "desc");
```

### Search

```typescript
// Search across different entities
const foundTournaments = searchTournaments("Augusta");
const foundTourCards = searchTourCards("Tiger");
const foundTours = searchTours("Major");
const foundTiers = searchTiers("Elite");
```

## Computed Values

### Statistics

```typescript
// Tournament statistics
const tournamentStats = getTournamentStats();
// Returns: { total, completed, current, upcoming }

// Member statistics
const memberStats = getMemberStats();
// Returns: { totalMembers, activeTourCards, totalEarnings }

// Tour statistics
const tourStats = getTourStats();
// Returns: { totalTours, totalBuyIn, avgBuyIn }

// Earnings distribution
const earningsDistribution = getEarningsDistribution();
// Returns: { total, average, median, top10Percent }
```

### Leaderboards and Counts

```typescript
// General leaderboard
const standings = getStandings();
const leaderboard = getLeaderboard();

// Tour-specific leaderboard
const tourLeaderboard = getLeaderboardByTour(tourId);

// Count distributions
const tournamentCountByTier = getTournamentCountByTier();
const memberCountByTour = getMemberCountByTour();
```

### Course Information

```typescript
// Get course data (derived from tournaments)
const course = getCourse(courseId);
const allCourses = getAllCourses();
const coursesByLocation = getCoursesByLocation("Florida");
```

## Convenience Hooks

### Basic Data Hooks

```typescript
// Get all data
const { season, member, allTourCards, tournaments, tours, tiers } =
  useSeasonalData();

// Get specific items
const tournament = useTournament(id);
const tour = useTour(id);
const tier = useTier(id);
const course = useCourse(id);
```

### Computed Data Hooks

```typescript
// Tournament groupings
const tournamentsByStatus = useTournamentsGroupedByStatus();
const upcomingTournaments = useUpcomingTournaments();

// Statistics
const earningsDistribution = useEarningsDistribution();
const tourStats = useTourStats();
const memberStats = useMemberStats();
```

### Filtering and Sorting Hooks

```typescript
// Advanced filtering
const filteredTournaments = useFilteredTournaments(filters);
const filteredTourCards = useFilteredTourCards(filters);

// Sorting
const sortedTourCards = useSortedTourCards("earnings", "desc");

// Search
const searchResults = useSearchTournaments(query);
```

### Action Hooks

```typescript
// Get all actions
const actions = useSeasonalActions();

// Get batch actions
const batchActions = useBatchActions();

// Use specific actions
actions.updateTournament(id, updates);
batchActions.batchUpdateTourCards(updates);
```

## Examples

### Complete Filtering Example

```typescript
function TournamentFilter() {
  const [filters, setFilters] = useState<TournamentFilters>({
    status: ["upcoming"],
    tierIds: ["elite-tier"],
    dateRange: {
      start: new Date(),
      end: new Date("2024-12-31")
    }
  });

  const filteredTournaments = useFilteredTournaments(filters);

  return (
    <div>
      {filteredTournaments.map(tournament => (
        <div key={tournament.id}>
          <h3>{tournament.name}</h3>
          <p>{tournament.course.name} - {tournament.course.location}</p>
          <p>Tier: {tournament.tier.name}</p>
        </div>
      ))}
    </div>
  );
}
```

### Leaderboard with Sorting

```typescript
function Leaderboard() {
  const [sortKey, setSortKey] = useState<keyof MinimalTourCard>("earnings");
  const [direction, setDirection] = useState<SortDirection>("desc");

  const sortedTourCards = useSortedTourCards(sortKey, direction);

  return (
    <div>
      <select value={sortKey} onChange={(e) => setSortKey(e.target.value as keyof MinimalTourCard)}>
        <option value="earnings">Earnings</option>
        <option value="points">Points</option>
        <option value="displayName">Name</option>
      </select>

      {sortedTourCards.slice(0, 10).map((card, index) => (
        <div key={card.id}>
          #{index + 1} {card.displayName} - ${card.earnings}
        </div>
      ))}
    </div>
  );
}
```

### Batch Update Example

```typescript
function BulkEarningsUpdate() {
  const batchActions = useBatchActions();

  const handleBulkUpdate = () => {
    const updates = [
      { id: "card1", updates: { earnings: 5000 } },
      { id: "card2", updates: { earnings: 3000 } },
      { id: "card3", updates: { earnings: 1000 } },
    ];

    batchActions.batchUpdateTourCards(updates);
  };

  return (
    <button onClick={handleBulkUpdate}>
      Update Multiple Earnings
    </button>
  );
}
```

## Best Practices

### Performance

1. **Use Specific Hooks**: Use the most specific hook for your needs (e.g., `useTournament(id)` instead of `useSeasonalData()` and filtering)

2. **Batch Operations**: When updating multiple records, use batch operations instead of individual updates

3. **Filter Early**: Apply filters at the store level rather than in components for better performance

4. **Memoize Heavy Computations**: Use useMemo for expensive derived computations in components

### Data Management

1. **Validate Before Updates**: Use the `validateData()` function to check data integrity

2. **Monitor Storage Usage**: Check `getDataSummary()` periodically to monitor localStorage usage

3. **Handle Stale Data**: Use `isDataStale()` and `getDataAge()` to determine when to refresh data

4. **Type Safety**: Always use the provided TypeScript types for better development experience

### Error Handling

1. **Check for Null Data**: Always check if arrays/objects exist before using them

2. **Validate Updates**: Ensure updates have valid data before applying them

3. **Handle Edge Cases**: Consider empty states and missing data scenarios

```typescript
// Good practice
const tournaments = useSeasonalData().tournaments;
if (tournaments && tournaments.length > 0) {
  // Use tournaments safely
}

// Better practice with specific hook
const upcomingTournaments = useUpcomingTournaments();
if (upcomingTournaments.length > 0) {
  // Use tournaments safely
}
```

## Migration Guide

If you're upgrading from the basic store, here's what's changed:

1. **New Methods**: All the CRUD, filtering, and computed methods are new additions
2. **Enhanced Hooks**: The hook library is greatly expanded
3. **Type Safety**: Better TypeScript support with exported types
4. **Batch Operations**: New batch update capabilities
5. **Course Data**: Course information is now derived from tournaments

The existing basic functionality remains unchanged, so existing code will continue to work.
