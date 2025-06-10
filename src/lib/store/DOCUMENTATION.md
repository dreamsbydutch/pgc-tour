# Store Architecture Documentation

## Overview

The new store architecture is a domain-driven design that replaces the monolithic store approach with specialized stores for better separation of concerns, improved performance, and enhanced maintainability.

## Architecture Components

### 1. Domain Stores

#### Tournament Store (`domains/tournament/store.ts`)

Manages tournament metadata and lifecycle.

```typescript
import { useTournamentStore } from "@/lib/store";

const { currentTournament, setCurrentTournament, updateTournamentStatus } =
  useTournamentStore();
```

#### Leaderboard Store (`domains/leaderboard/store.ts`)

Handles real-time leaderboard data with polling capabilities.

```typescript
import { useLeaderboardStore } from "@/lib/store";

const { leaderboard, teams, startPolling, stopPolling } = useLeaderboardStore();
```

#### User Store (`domains/user/store.ts`)

Centralizes user-specific data, teams, and preferences.

```typescript
import { useUserStore } from "@/lib/store";

const { profile, userTeams, updatePreferences } = useUserStore();
```

#### UI Store (`domains/ui/store.ts`)

Manages application UI state and interactions.

```typescript
import { useUIStore } from "@/lib/store";

const { selectedGolferId, activeTab, filters, selectGolfer } = useUIStore();
```

### 2. Service Layer

#### Tournament Service (`services/tournament.service.ts`)

API abstraction for tournament data operations.

```typescript
import { TournamentService } from "@/lib/store";

// Get current tournament
const response = await TournamentService.getCurrentTournament();

// Get tournament by ID
const tournament = await TournamentService.getTournamentById("tournament-id");
```

#### Leaderboard Service (`services/leaderboard.service.ts`)

API abstraction for leaderboard data with real-time subscriptions.

```typescript
import { LeaderboardService } from "@/lib/store";

// Get leaderboard data
const leaderboard = await LeaderboardService.getLeaderboard("tournament-id");

// Subscribe to real-time updates
const unsubscribe = LeaderboardService.subscribeToUpdates(
  "tournament-id",
  (data) => {
    // Handle updates
  },
);
```

### 3. Integration Hooks

#### Tournament Data Hooks (`hooks/useTournamentData.ts`)

```typescript
import { useTournamentData, useActiveTournament } from "@/lib/store";

// Get current tournament data with caching
const { tournament, isLoading, error, refetch } = useTournamentData();

// Get active tournaments
const { tournaments } = useActiveTournament();
```

#### Leaderboard Data Hooks (`hooks/useLeaderboardData.ts`)

```typescript
import { useLeaderboardData, useTeamsData } from "@/lib/store";

// Get leaderboard with auto-refresh
const { leaderboard, isLoading, toggleAutoRefresh } =
  useLeaderboardData("tournament-id");

// Get teams data
const { teams } = useTeamsData("tournament-id");
```

#### Composite Tournament Page Hook (`hooks/useTournamentPage.ts`)

```typescript
import { useTournamentPage } from "@/lib/store";

// Get all tournament page data in one hook
const { tournament, leaderboard, teams, selectedGolfer, isLoading, actions } =
  useTournamentPage("tournament-id");
```

### 4. Store Provider

#### Setup (`providers/StoreProvider.tsx`)

```typescript
import { StoreProvider } from '@/lib/store';

function App() {
  return (
    <StoreProvider>
      <YourApp />
    </StoreProvider>
  );
}
```

## Usage Patterns

### 1. Component Usage

```typescript
import { useTournamentPage, StoreErrorBoundary } from '@/lib/store';

function TournamentPageComponent({ tournamentId }: { tournamentId: string }) {
  const {
    tournament,
    leaderboard,
    selectedGolfer,
    isLoading,
    actions
  } = useTournamentPage(tournamentId);

  if (isLoading) return <LoadingSpinner />;

  return (
    <StoreErrorBoundary>
      <div>
        <h1>{tournament?.name}</h1>
        <LeaderboardTable
          data={leaderboard}
          onSelectGolfer={actions.selectGolfer}
          selectedGolferId={selectedGolfer?.id}
        />
      </div>
    </StoreErrorBoundary>
  );
}
```

### 2. Error Handling

```typescript
import { StoreErrorBoundary, useStoreErrorHandler } from '@/lib/store';

function MyComponent() {
  const { handleError } = useStoreErrorHandler();

  const handleAction = async () => {
    try {
      // Some store operation
    } catch (error) {
      handleError(error, 'tournament-update');
    }
  };

  return (
    <StoreErrorBoundary>
      <button onClick={handleAction}>Update Tournament</button>
    </StoreErrorBoundary>
  );
}
```

### 3. Migration Usage

```typescript
import { useGradualMigration, FEATURE_FLAGS } from '@/lib/store';
import { useOldTournamentData } from '@/lib/old-store';

function TournamentComponent() {
  const tournamentData = useGradualMigration(
    useOldTournamentData,
    useTournamentData,
    FEATURE_FLAGS.NEW_TOURNAMENT_STORE
  );

  return <div>{/* Use tournamentData */}</div>;
}
```

## Data Flow

```
Component → Integration Hook → Service Layer → API
    ↓              ↓               ↓
UI Updates ← Domain Store ← Response Data
```

1. **Component** calls integration hook
2. **Integration Hook** uses React Query to fetch data via service layer
3. **Service Layer** makes API calls and handles responses
4. **Domain Store** receives data and updates state
5. **Component** re-renders with new data

## Performance Features

### 1. Automatic Caching

- React Query provides intelligent caching
- Configurable stale times and garbage collection
- Background refetching

### 2. Selective Subscriptions

- Components only re-render when relevant data changes
- Zustand's selector-based subscriptions
- Memoized computed values

### 3. Real-time Updates

- WebSocket-like polling for leaderboard updates
- Automatic retry with exponential backoff
- Optimistic updates for better UX

## Testing

### 1. Store Tests

```typescript
import { renderHook, act } from "@testing-library/react";
import { useTournamentStore } from "@/lib/store";

test("should update tournament status", () => {
  const { result } = renderHook(() => useTournamentStore());

  act(() => {
    result.current.updateTournamentStatus("completed");
  });

  expect(result.current.currentTournament?.status).toBe("completed");
});
```

### 2. Hook Tests

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTournamentData } from '@/lib/store';

test('should fetch tournament data', async () => {
  const { result } = renderHook(() => useTournamentData(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={new QueryClient()}>
        {children}
      </QueryClientProvider>
    ),
  });

  await waitFor(() => result.current.tournament !== null);

  expect(result.current.tournament).toBeDefined();
});
```

## Migration Strategy

### 1. Feature Flags

Enable gradual rollout with environment variables:

```env
NEXT_PUBLIC_NEW_TOURNAMENT_STORE=true
NEXT_PUBLIC_NEW_LEADERBOARD_STORE=true
NEXT_PUBLIC_NEW_USER_STORE=true
NEXT_PUBLIC_NEW_UI_STORE=true
```

### 2. Data Migration

Automatic migration of localStorage data from old format to new structure.

### 3. Gradual Adoption

Use `useGradualMigration` hook to switch between old and new implementations.

## Best Practices

### 1. Use Integration Hooks

Always use the provided integration hooks instead of accessing stores directly:

```typescript
// ✅ Good
const { tournament, isLoading } = useTournamentData();

// ❌ Avoid
const tournament = useTournamentStore((state) => state.currentTournament);
```

### 2. Error Boundaries

Wrap components with `StoreErrorBoundary` for graceful error handling:

```typescript
<StoreErrorBoundary>
  <TournamentComponent />
</StoreErrorBoundary>
```

### 3. Selective Subscriptions

Use specific selectors to minimize re-renders:

```typescript
// ✅ Good - only re-renders when name changes
const tournamentName = useTournamentStore(
  (state) => state.currentTournament?.name,
);

// ❌ Avoid - re-renders on any tournament change
const tournament = useTournamentStore((state) => state.currentTournament);
```

### 4. Cleanup

Always cleanup subscriptions and intervals:

```typescript
useEffect(() => {
  const cleanup = startPolling();
  return cleanup;
}, [startPolling]);
```

## Troubleshooting

### Common Issues

1. **Data not updating**: Check if React Query cache is stale
2. **Memory leaks**: Ensure proper cleanup of subscriptions
3. **Performance issues**: Use selective subscriptions and memoization
4. **Type errors**: Import types from the main store index

### Debug Tools

- React Query DevTools (development mode)
- Zustand DevTools (browser extension)
- Console logging in store actions

For more detailed examples, see the implementation files in the `/src/lib/store` directory.
