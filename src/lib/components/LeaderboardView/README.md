# LeaderboardView

A React component for displaying tournament leaderboards with PGC and PGA tour support.

## Usage

```tsx
import { LeaderboardContainer } from "@/lib/components/LeaderboardView";

// Basic usage
<LeaderboardContainer tournamentId="tournament-id" />

// With user authentication
<LeaderboardContainer
  tournamentId="tournament-id"
  userId="user-id"
  variant="regular"
/>

// Playoff variant
<LeaderboardContainer
  tournamentId="tournament-id"
  variant="playoff"
/>
```

## Props

- `tournamentId` (required): Tournament identifier
- `variant`: `"regular"` | `"playoff"` | `"historical"` (default: `"regular"`)
- `inputTour`: Pre-selected tour ID
- `userId`: User ID for personalized view
- `onRefetch`: Callback fired when data is refreshed

## Features

- Automatic data fetching via tRPC
- Tour switching (PGC tours + PGA)
- Playoff and regular tournament support
- Responsive design
- Loading and error states
- Real-time data updates

````

### `api.golfer.getByTournament`

Input: `{ tournamentId: string }`

Returns golfers for the tournament:

```typescript
Golfer[] // Array of golfer objects with tournament data
````

### `api.team.getByTournament`

Input: `{ tournamentId: string }`

Returns teams for the tournament:

```typescript
Team[] // Array of team objects with tour card data
```

### `api.tour.getBySeason`

Input: `{ seasonId: string }`

Returns tours for the tournament's season:

```typescript
Tour[] // Array of tour objects for the season
```

### `api.tourCard.getBySeason`

Input: `{ seasonId: string }`

Returns tour cards for the tournament's season:

```typescript
TourCard[] // Array of tour card objects with member and tour data
```

### `api.member.getById`

Input: `{ memberId: string }`

Returns user data with tour card and member information:

```typescript
{
  id: string;
  tourCards: TourCard[];
  // ... other member properties
}
```

## Component Architecture

### LeaderboardContainer

- **Purpose**: Main container component that handles data fetching and display
- **Props**: `tournamentId`, `variant`, `inputTour`, `userId`
- **Features**: Loading states, error handling, data transformation

### useLeaderboardData Hook

- **Purpose**: Fetches and manages all leaderboard data using tRPC
- **Returns**: `{ props, loading, error, refetch }`
- **Features**:
  - Automatic data mapping from tRPC responses
  - Real-time caching with tRPC's query cache
  - Error handling with retry functionality
  - Loading states
  - Manual refetch capability
  - Parallel data fetching for optimal performance
  - Optimistic updates when data changes

### PGCLeaderboard & PGALeaderboard

- **Purpose**: Specialized leaderboard components for different tournament types
- **Features**: Type-safe props, sorting, filtering

### LeaderboardListing

- **Purpose**: Individual leaderboard row component
- **Features**: Discriminated unions for PGC/PGA types, expandable details

### ScoreDisplay

- **Purpose**: Displays scores with proper formatting
- **Features**: Discriminated unions, tournament state handling

## Type Safety Features

### Discriminated Unions

The components use TypeScript discriminated unions to ensure type safety:

```typescript
type ScoreDisplayProps =
  | {
      type: "PGC";
      team: TeamData;
    }
  | {
      type: "PGA";
      golfer: GolferData;
    };
```

This prevents runtime errors by ensuring the correct data is available for each component type.

### Proper Data Mapping

The hook automatically maps API responses to the expected component props, handling:

- Date string conversion
- Null/undefined handling
- Type casting
- Nested object mapping

## Error Handling

The system includes comprehensive error handling:

- **Network errors**: Handled with user-friendly messages
- **Type errors**: Prevented with TypeScript
- **Missing data**: Graceful fallbacks
- **Loading states**: Built-in loading indicators

## Performance Optimizations

- **Memoized components**: Prevent unnecessary re-renders
- **Optimized data structures**: Efficient data mapping
- **Lazy loading**: Components load only when needed
- **Proper dependency arrays**: Hooks optimize re-fetching

## Migration Guide

If you're migrating from the old LeaderboardView:

1. Replace direct LeaderboardView usage with LeaderboardContainer
2. Update your API endpoints to match the expected format
3. Remove manual data fetching code
4. Update your prop types to match the new structure

### Before:

```tsx
// Old approach - manual data fetching
const [tournament, setTournament] = useState(null);
const [golfers, setGolfers] = useState([]);
// ... more state

useEffect(() => {
  // Manual API calls
  fetch(`/api/tournaments/${id}`)...
}, [id]);

return (
  <LeaderboardView
    tournament={tournament}
    golfers={golfers}
    // ... more props
  />
);
```

### After:

```tsx
// New approach - automatic data fetching
return <LeaderboardContainer tournamentId={id} userId={userId} />;
```

## Contributing

When adding new features:

1. **Update types** in `types.ts`
2. **Add proper error handling** in hooks
3. **Include loading states** for new UI elements
4. **Write type-safe components** using discriminated unions
5. **Test with different data scenarios**

## File Structure

```
LeaderboardView/
├── components/
│   ├── LeaderboardContainer.tsx    # Main container
│   ├── PGCLeaderboard.tsx         # PGC-specific leaderboard
│   ├── PGALeaderboard.tsx         # PGA-specific leaderboard
│   ├── LeaderboardListing.tsx     # Individual row component
│   ├── ScoreDisplay.tsx           # Score display component
│   └── ...
├── hooks/
│   ├── useLeaderboardData.ts      # Data fetching hook
│   └── useLeaderboardLogic.ts     # Business logic hook
├── types.ts                       # TypeScript type definitions
├── utils/
│   ├── index.ts                   # Utility functions
│   └── constants.tsx              # Constants and config
├── examples/
│   └── usage.tsx                  # Usage examples
└── index.ts                       # Main exports
```
