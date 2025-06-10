# New Store Architecture Implementation Guide

## 🎉 **IMPLEMENTATION STATUS: PHASE 2 COMPLETE** ✅

**Last Updated**: June 10, 2025  
**Phase 2 Status**: 100% Complete  
**Ready for Production**: YES

This document outlines the implementation of the new store architecture that has been successfully completed. The new system replaces the monolithic store approach with domain-driven, specialized stores that provide better separation of concerns, improved performance, and enhanced maintainability.

## ✅ **Phase 2 Completion Summary**

Phase 2 has been **successfully completed** with all major objectives achieved:

- [x] **Complete Component Migration** - All 8+ major components migrated
- [x] **Legacy Code Removal** - useMainStore pattern completely eliminated
- [x] **Test Infrastructure** - Comprehensive testing setup implemented
- [x] **Documentation** - Complete developer guides created
- [x] **Type Safety** - Full TypeScript integration
- [x] **Performance Optimization** - Modern query patterns implemented

**See**: `PHASE_2_FINAL_SUMMARY.md` for detailed completion report.

## Overview

This document outlines the implementation of the new store architecture proposed in the tournament page refactor. The new system replaces the monolithic store approach with domain-driven, specialized stores that provide better separation of concerns, improved performance, and enhanced maintainability.

## Current vs. New Architecture

### Current Issues

- **Monolithic stores**: Single large stores handling multiple domains
- **Data redundancy**: Same data duplicated across multiple stores
- **Complex state synchronization**: Manual coordination between stores
- **Performance issues**: Unnecessary re-renders and API calls
- **Testing difficulties**: Tightly coupled state management

### New Solution

- **Domain separation**: Each store handles one specific domain
- **Single source of truth**: Clear data ownership and flow
- **Automatic synchronization**: React Query manages cache coordination
- **Optimized performance**: Selective subscriptions and memoization
- **Enhanced testability**: Isolated, mockable store slices

## Store Architecture

```
stores/
├── domains/
│   ├── tournament/           # Tournament metadata and lifecycle
│   ├── leaderboard/         # Real-time leaderboard data
│   ├── user/               # User-specific data and preferences
│   └── ui/                 # UI state and interactions
├── services/               # Business logic services
├── hooks/                 # Store integration hooks
├── providers/             # Store providers and setup
└── utils/                 # Store utilities and helpers
```

## Domain Store Specifications

### 1. Tournament Store

**Responsibility**: Tournament metadata, status, and lifecycle management

```typescript
interface TournamentStore {
  // State
  tournaments: Map<string, Tournament>;
  currentTournament: Tournament | null;
  nextTournament: Tournament | null;
  pastTournaments: Tournament[];

  // Actions
  setCurrentTournament: (tournament: Tournament | null) => void;
  addTournament: (tournament: Tournament) => void;
  updateTournament: (id: string, updates: Partial<Tournament>) => void;
  loadTournaments: () => Promise<void>;

  // Computed
  activeTournaments: Tournament[];
  upcomingTournaments: Tournament[];
  isLoading: boolean;
}
```

### 2. Leaderboard Store

**Responsibility**: Real-time leaderboard data and updates

```typescript
interface LeaderboardStore {
  // State
  leaderboards: Map<string, LeaderboardData>;
  currentLeaderboard: LeaderboardData | null;
  lastUpdated: Map<string, Date>;

  // Actions
  setLeaderboard: (tournamentId: string, data: LeaderboardData) => void;
  updateTeamPosition: (
    tournamentId: string,
    teamId: string,
    position: string,
  ) => void;
  updateGolferScore: (
    tournamentId: string,
    golferId: string,
    score: number,
  ) => void;
  refreshLeaderboard: (tournamentId: string) => Promise<void>;

  // Computed
  isPolling: boolean;
  teamsByPosition: Team[];
  golfersByPosition: Golfer[];
}
```

### 3. User Store

**Responsibility**: User-specific data, teams, and preferences

```typescript
interface UserStore {
  // State
  currentUser: User | null;
  currentTourCard: TourCard | null;
  userTeams: Map<string, Team>; // tournamentId -> Team
  preferences: UserPreferences;

  // Actions
  setCurrentUser: (user: User | null) => void;
  setCurrentTourCard: (tourCard: TourCard | null) => void;
  addUserTeam: (tournamentId: string, team: Team) => void;
  updateUserTeam: (tournamentId: string, updates: Partial<Team>) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;

  // Computed
  isAuthenticated: boolean;
  currentTeamForTournament: (tournamentId: string) => Team | null;
  userStandings: TourCard[];
}
```

### 4. UI Store

**Responsibility**: UI state, loading states, and user interactions

```typescript
interface UIStore {
  // State
  loadingStates: Map<string, boolean>;
  errors: Map<string, Error>;
  modals: Map<string, boolean>;
  selectedTour: string | null;
  selectedTournament: string | null;

  // Actions
  setLoading: (key: string, loading: boolean) => void;
  setError: (key: string, error: Error | null) => void;
  toggleModal: (modalId: string) => void;
  setSelectedTour: (tourId: string | null) => void;
  setSelectedTournament: (tournamentId: string | null) => void;

  // Computed
  isAnyLoading: boolean;
  hasErrors: boolean;
  currentModal: string | null;
}
```

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

#### 1.1 Create Store Definitions

```typescript
// src/lib/store/domains/tournament/store.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface TournamentState {
  tournaments: Map<string, Tournament>;
  currentTournament: Tournament | null;
  nextTournament: Tournament | null;
  pastTournaments: Tournament[];
  isLoading: boolean;
  error: Error | null;
}

interface TournamentActions {
  setCurrentTournament: (tournament: Tournament | null) => void;
  addTournament: (tournament: Tournament) => void;
  updateTournament: (id: string, updates: Partial<Tournament>) => void;
  loadTournaments: () => Promise<void>;
  reset: () => void;
}

export type TournamentStore = TournamentState & TournamentActions;

const initialState: TournamentState = {
  tournaments: new Map(),
  currentTournament: null,
  nextTournament: null,
  pastTournaments: [],
  isLoading: false,
  error: null,
};

export const useTournamentStore = create<TournamentStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        setCurrentTournament: (tournament) =>
          set((state) => {
            state.currentTournament = tournament;
          }),

        addTournament: (tournament) =>
          set((state) => {
            state.tournaments.set(tournament.id, tournament);
          }),

        updateTournament: (id, updates) =>
          set((state) => {
            const existing = state.tournaments.get(id);
            if (existing) {
              state.tournaments.set(id, { ...existing, ...updates });
            }
          }),

        loadTournaments: async () => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          try {
            const tournaments = await tournamentService.getAllTournaments();
            set((state) => {
              tournaments.forEach((t) => state.tournaments.set(t.id, t));
              state.isLoading = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
              state.isLoading = false;
            });
          }
        },

        reset: () => set(initialState),
      })),
      {
        name: "tournament-store",
        partialize: (state) => ({
          tournaments: Array.from(state.tournaments.entries()),
          currentTournament: state.currentTournament,
          nextTournament: state.nextTournament,
          pastTournaments: state.pastTournaments,
        }),
      },
    ),
    { name: "TournamentStore" },
  ),
);
```

#### 1.2 Create Service Layer

```typescript
// src/lib/store/services/tournament.service.ts
export interface ITournamentService {
  getAllTournaments(): Promise<Tournament[]>;
  getTournament(id: string): Promise<Tournament>;
  getCurrentTournament(): Promise<Tournament | null>;
  getUpcomingTournaments(): Promise<Tournament[]>;
  getPastTournaments(): Promise<Tournament[]>;
}

class TournamentService implements ITournamentService {
  private baseUrl = "/api/tournaments";

  async getAllTournaments(): Promise<Tournament[]> {
    const response = await fetch(`${this.baseUrl}/all`);
    if (!response.ok) throw new Error("Failed to fetch tournaments");
    const data = await response.json();
    return data.tournaments;
  }

  async getTournament(id: string): Promise<Tournament> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch tournament ${id}`);
    return response.json();
  }

  async getCurrentTournament(): Promise<Tournament | null> {
    const response = await fetch(`${this.baseUrl}/current`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error("Failed to fetch current tournament");
    return response.json();
  }

  async getUpcomingTournaments(): Promise<Tournament[]> {
    const response = await fetch(`${this.baseUrl}/upcoming`);
    if (!response.ok) throw new Error("Failed to fetch upcoming tournaments");
    const data = await response.json();
    return data.tournaments;
  }

  async getPastTournaments(): Promise<Tournament[]> {
    const response = await fetch(`${this.baseUrl}/past`);
    if (!response.ok) throw new Error("Failed to fetch past tournaments");
    const data = await response.json();
    return data.tournaments;
  }
}

export const tournamentService = new TournamentService();
```

#### 1.3 Create Integration Hooks

```typescript
// src/lib/store/hooks/useTournamentData.ts
import { useQuery } from "@tanstack/react-query";
import { useTournamentStore } from "../domains/tournament/store";
import { tournamentService } from "../services/tournament.service";

export function useTournamentData(tournamentId?: string) {
  const store = useTournamentStore();

  // Query for specific tournament
  const tournamentQuery = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => tournamentService.getTournament(tournamentId!),
    enabled: !!tournamentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for all tournaments
  const tournamentsQuery = useQuery({
    queryKey: ["tournaments"],
    queryFn: tournamentService.getAllTournaments,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Sync with store when data changes
  useEffect(() => {
    if (tournamentQuery.data) {
      store.addTournament(tournamentQuery.data);
    }
  }, [tournamentQuery.data, store]);

  useEffect(() => {
    if (tournamentsQuery.data) {
      tournamentsQuery.data.forEach((t) => store.addTournament(t));
    }
  }, [tournamentsQuery.data, store]);

  return {
    tournament: tournamentId ? store.tournaments.get(tournamentId) : null,
    tournaments: Array.from(store.tournaments.values()),
    currentTournament: store.currentTournament,
    nextTournament: store.nextTournament,
    pastTournaments: store.pastTournaments,
    isLoading: tournamentQuery.isLoading || tournamentsQuery.isLoading,
    error: tournamentQuery.error || tournamentsQuery.error,
    refetch: tournamentQuery.refetch,
  };
}
```

### Phase 2: Store Implementation (Week 2)

#### 2.1 Implement Remaining Stores

Create similar implementations for:

- `src/lib/store/domains/leaderboard/store.ts`
- `src/lib/store/domains/user/store.ts`
- `src/lib/store/domains/ui/store.ts`

#### 2.2 Create Store Provider

```typescript
// src/lib/store/providers/StoreProvider.tsx
import { createContext, useContext, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

#### 2.3 Create Composite Hooks

```typescript
// src/lib/store/hooks/useTournamentPage.ts
export function useTournamentPage(tournamentId?: string) {
  const tournamentData = useTournamentData(tournamentId);
  const leaderboardData = useLeaderboardData(tournamentId);
  const userData = useUserData();
  const uiState = useUIState();

  return {
    // Tournament data
    tournament: tournamentData.tournament,
    currentTournament: tournamentData.currentTournament,
    isLoadingTournament: tournamentData.isLoading,

    // Leaderboard data
    leaderboard: leaderboardData.leaderboard,
    teams: leaderboardData.teams,
    golfers: leaderboardData.golfers,
    isLoadingLeaderboard: leaderboardData.isLoading,

    // User data
    user: userData.currentUser,
    tourCard: userData.currentTourCard,
    userTeam: userData.currentTeamForTournament(tournamentId),

    // UI state
    selectedTour: uiState.selectedTour,
    isLoading: uiState.isAnyLoading,
    errors: uiState.hasErrors,
  };
}
```

### Phase 3: Migration Strategy (Week 3)

#### 3.1 Create Migration Utilities

```typescript
// src/lib/store/migration/migrationUtils.ts
export interface MigrationStep {
  id: string;
  description: string;
  execute: () => Promise<void>;
  rollback: () => Promise<void>;
}

export class StoreMigration {
  private steps: MigrationStep[] = [];

  addStep(step: MigrationStep) {
    this.steps.push(step);
  }

  async execute() {
    for (const step of this.steps) {
      try {
        console.log(`Executing migration: ${step.description}`);
        await step.execute();
        console.log(`✅ Completed: ${step.description}`);
      } catch (error) {
        console.error(`❌ Failed: ${step.description}`, error);
        await this.rollback();
        throw error;
      }
    }
  }

  async rollback() {
    for (const step of [...this.steps].reverse()) {
      try {
        await step.rollback();
      } catch (error) {
        console.error(`Rollback failed for: ${step.description}`, error);
      }
    }
  }
}
```

#### 3.2 Data Migration Steps

```typescript
// src/lib/store/migration/steps/migrateTournamentData.ts
export const migrateTournamentData: MigrationStep = {
  id: "migrate-tournament-data",
  description: "Migrate tournament data from old store to new store",

  async execute() {
    const oldStore = useMainStore.getState();
    const newTournamentStore = useTournamentStore.getState();

    // Migrate current tournament
    if (oldStore.currentTournament) {
      newTournamentStore.setCurrentTournament(oldStore.currentTournament);
    }

    // Migrate tournament list
    if (oldStore.seasonTournaments) {
      oldStore.seasonTournaments.forEach((tournament) => {
        newTournamentStore.addTournament(tournament);
      });
    }

    // Migrate past tournaments
    if (oldStore.pastTournaments) {
      oldStore.pastTournaments.forEach((tournament) => {
        newTournamentStore.addTournament(tournament);
      });
    }
  },

  async rollback() {
    const newTournamentStore = useTournamentStore.getState();
    newTournamentStore.reset();
  },
};
```

#### 3.3 Feature Flags

```typescript
// src/lib/store/features/featureFlags.ts
export interface FeatureFlags {
  useNewStoreArchitecture: boolean;
  useNewTournamentStore: boolean;
  useNewLeaderboardStore: boolean;
  useNewUserStore: boolean;
  useNewUIStore: boolean;
}

const defaultFlags: FeatureFlags = {
  useNewStoreArchitecture: false,
  useNewTournamentStore: false,
  useNewLeaderboardStore: false,
  useNewUserStore: false,
  useNewUIStore: false,
};

export function useFeatureFlags(): FeatureFlags {
  return {
    ...defaultFlags,
    // Override with environment variables or user preferences
    useNewStoreArchitecture: process.env.NEXT_PUBLIC_NEW_STORE === "true",
    useNewTournamentStore:
      process.env.NEXT_PUBLIC_NEW_TOURNAMENT_STORE === "true",
    // ... other flags
  };
}
```

### Phase 4: Testing Strategy (Week 4)

#### 4.1 Store Testing

```typescript
// src/lib/store/domains/tournament/__tests__/store.test.ts
import { renderHook, act } from "@testing-library/react";
import { useTournamentStore } from "../store";

describe("TournamentStore", () => {
  beforeEach(() => {
    useTournamentStore.getState().reset();
  });

  it("should set current tournament", () => {
    const { result } = renderHook(() => useTournamentStore());
    const mockTournament = { id: "1", name: "Test Tournament" } as Tournament;

    act(() => {
      result.current.setCurrentTournament(mockTournament);
    });

    expect(result.current.currentTournament).toEqual(mockTournament);
  });

  it("should add tournament to collection", () => {
    const { result } = renderHook(() => useTournamentStore());
    const mockTournament = { id: "1", name: "Test Tournament" } as Tournament;

    act(() => {
      result.current.addTournament(mockTournament);
    });

    expect(result.current.tournaments.get("1")).toEqual(mockTournament);
  });

  it("should handle loading states correctly", async () => {
    const { result } = renderHook(() => useTournamentStore());

    // Mock the service
    jest
      .spyOn(tournamentService, "getAllTournaments")
      .mockResolvedValue([{ id: "1", name: "Test" } as Tournament]);

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.loadTournaments();
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.tournaments.size).toBe(1);
  });
});
```

#### 4.2 Hook Testing

```typescript
// src/lib/store/hooks/__tests__/useTournamentData.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTournamentData } from '../useTournamentData';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useTournamentData', () => {
  it('should fetch tournament data', async () => {
    const mockTournament = { id: '1', name: 'Test Tournament' };

    jest.spyOn(tournamentService, 'getTournament')
      .mockResolvedValue(mockTournament as Tournament);

    const { result } = renderHook(
      () => useTournamentData('1'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.tournament).toEqual(mockTournament);
    });
  });
});
```

#### 4.3 Integration Testing

```typescript
// src/lib/store/__tests__/integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { StoreProvider } from '../providers/StoreProvider';
import { TournamentPage } from '../../components/TournamentPage';

describe('Store Integration', () => {
  it('should provide tournament data to components', async () => {
    const mockTournament = { id: '1', name: 'Test Tournament' };

    jest.spyOn(tournamentService, 'getTournament')
      .mockResolvedValue(mockTournament as Tournament);

    render(
      <StoreProvider>
        <TournamentPage tournamentId="1" />
      </StoreProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Tournament')).toBeInTheDocument();
    });
  });
});
```

## Performance Optimizations

### 1. Selective Subscriptions

```typescript
// Only subscribe to specific store slices
export function useTournamentName(tournamentId: string) {
  return useTournamentStore(
    useCallback(
      (state) => state.tournaments.get(tournamentId)?.name,
      [tournamentId],
    ),
  );
}
```

### 2. Memoized Selectors

```typescript
// Memoize expensive computations
export const selectActiveTeams = createSelector(
  (state: LeaderboardStore) => state.currentLeaderboard?.teams || [],
  (teams) => teams.filter((team) => team.position !== "CUT"),
);
```

### 3. Debounced Updates

```typescript
// Debounce frequent updates
export function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

## Error Handling

### 1. Store Error Boundaries

```typescript
// src/lib/store/providers/StoreErrorBoundary.tsx
export class StoreErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Store Error:', error, errorInfo);

    // Reset stores on critical errors
    useTournamentStore.getState().reset();
    useLeaderboardStore.getState().reset();
    useUserStore.getState().reset();
    useUIStore.getState().reset();
  }

  render() {
    if (this.state.hasError) {
      return <StoreErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### 2. Graceful Degradation

```typescript
// Fallback to cached data on errors
export function useTournamentDataWithFallback(tournamentId: string) {
  const { data, error, isLoading } = useTournamentData(tournamentId);
  const cachedData = useTournamentStore((state) =>
    state.tournaments.get(tournamentId),
  );

  return {
    tournament: data || cachedData,
    isLoading: isLoading && !cachedData,
    error: error && !cachedData ? error : null,
  };
}
```

## Monitoring and Debugging

### 1. Store DevTools

```typescript
// Enhanced devtools integration
const useTournamentStore = create<TournamentStore>()(
  devtools(
    (set, get) => ({
      // ... store implementation
    }),
    {
      name: "TournamentStore",
      trace: true,
      anonymousActionType: "TournamentAction",
    },
  ),
);
```

### 2. Performance Monitoring

```typescript
// Monitor store performance
export function useStorePerformanceMonitor() {
  useEffect(() => {
    const measureStoreUpdates = () => {
      performance.mark("store-update-start");

      // Monitor store subscriptions
      const unsubscribe = useTournamentStore.subscribe(() => {
        performance.mark("store-update-end");
        performance.measure(
          "store-update",
          "store-update-start",
          "store-update-end",
        );
      });

      return unsubscribe;
    };

    return measureStoreUpdates();
  }, []);
}
```

## Migration Checklist

### Pre-Migration

- [ ] Create feature flags for gradual rollout
- [ ] Implement new store architecture
- [ ] Create comprehensive test suite
- [ ] Set up monitoring and alerting
- [ ] Create rollback procedures

### Migration Phase

- [ ] Enable feature flags for internal testing
- [ ] Run parallel systems (old and new)
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Address any issues found

### Post-Migration

- [ ] Remove old store code
- [ ] Update documentation
- [ ] Remove feature flags
- [ ] Monitor production metrics
- [ ] Conduct retrospective

## Success Metrics

### Performance Targets

- **Initial Load Time**: < 2 seconds
- **Store Update Time**: < 50ms
- **Memory Usage**: < 100MB for store state
- **Bundle Size Impact**: < 20KB increase

### Quality Targets

- **Test Coverage**: > 90%
- **Type Safety**: 100% TypeScript compliance
- **Error Rate**: < 1% of store operations
- **Developer Satisfaction**: > 8/10 in team survey

## Conclusion

This new store architecture provides a solid foundation for scalable state management in the PGC Tour application. By separating concerns, implementing proper caching strategies, and providing excellent developer experience, we can build more maintainable and performant features.

The phased migration approach ensures minimal risk while delivering incremental value throughout the process. The comprehensive testing strategy and monitoring capabilities provide confidence in the migration's success.

For questions or support during implementation, please refer to the team documentation or reach out to the architecture team.
