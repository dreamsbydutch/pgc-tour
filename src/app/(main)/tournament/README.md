# Tournament Page Module - Comprehensive Refactor Plan

## Executive Summary

The tournament page module currently serves as the primary interface for tournament management and leaderboard display. While functional, the codebase exhibits several architectural challenges that impact maintainability, performance, and scalability. This document outlines a comprehensive refactor strategy focused on efficiency, best practices, and proper separation of concerns.

## Current Architecture Analysis

### Strengths

- ✅ Well-organized directory structure with clear component separation
- ✅ Comprehensive state management using Zustand stores
- ✅ Proper TypeScript implementation throughout
- ✅ Good separation between UI components and business logic
- ✅ Effective use of Next.js App Router patterns
- ✅ Robust polling system for real-time updates

### Critical Issues Identified

#### 1. **State Management Complexity**

- **Problem**: Multiple overlapping stores (MainStore, LeaderboardStore) with unclear boundaries
- **Impact**: Data synchronization issues, redundant API calls, state inconsistencies
- **Evidence**: Mixed data sources in `LeaderboardPage.tsx` (lines 40-50)

#### 2. **Component Responsibility Violations**

- **Problem**: Components mixing data fetching, state management, and UI rendering
- **Impact**: Difficult testing, poor reusability, tight coupling
- **Evidence**: `ActiveTournamentView.tsx` handling polling, UI state, and API calls

#### 3. **Data Flow Anti-patterns**

- **Problem**: Prop drilling, unclear data dependencies, mixed data sources
- **Impact**: Debugging difficulties, performance issues, maintenance burden
- **Evidence**: Tournament data passed through multiple component layers

#### 4. **Performance Bottlenecks**

- **Problem**: Unnecessary re-renders, unoptimized API calls, missing memoization
- **Impact**: Poor user experience, excessive network requests
- **Evidence**: Real-time polling without proper debouncing/throttling

#### 5. **Code Duplication**

- **Problem**: Similar logic repeated across multiple components
- **Impact**: Maintenance burden, inconsistent behavior
- **Evidence**: Tournament state logic duplicated in multiple views

## Proposed Refactor Architecture

### 1. Domain-Driven Design Implementation

```
tournament/
├── domains/
│   ├── tournament-state/          # Tournament lifecycle management
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── leaderboard/              # Leaderboard data and updates
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── team-management/          # Team creation and editing
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── tournament-navigation/    # Tournament selection and routing
│       ├── hooks/
│       ├── services/
│       └── types/
├── shared/
│   ├── components/              # Reusable UI components
│   ├── hooks/                   # Cross-domain hooks
│   ├── services/               # Shared business logic
│   └── types/                  # Common type definitions
└── pages/                      # Page-level components
    ├── active/
    ├── upcoming/
    ├── past/
    └── historical/
```

### 2. State Management Refactor

#### Current Issues:

```typescript
// BEFORE: Mixed responsibilities and unclear data flow
const pastTournament = useMainStore((state) => state.pastTournaments)?.find(
  (t) => t.id === tournament.id,
);
const mainStoreGolfers = useLeaderboardStore((state) => state.golfers);
const storedGolfers = pastTournament
  ? pastTournament.golfers
  : mainStoreGolfers;
```

#### Proposed Solution:

```typescript
// AFTER: Clear domain separation and single source of truth
const { tournament, leaderboard, isLoading } = useTournamentData(tournamentId);
const { teams, golfers } = leaderboard;
```

#### New Store Architecture:

1. **TournamentStore**: Tournament metadata and state
2. **LeaderboardStore**: Real-time leaderboard data
3. **UserStore**: User-specific data (teams, preferences)
4. **UIStore**: UI state (loading, selections, etc.)

### 3. Service Layer Implementation

#### Tournament Service

```typescript
interface ITournamentService {
  getTournament(id: string): Promise<Tournament>;
  getCurrentTournament(): Promise<Tournament | null>;
  getUpcomingTournaments(): Promise<Tournament[]>;
  getPastTournaments(): Promise<Tournament[]>;
}
```

#### Leaderboard Service

```typescript
interface ILeaderboardService {
  getLeaderboard(tournamentId: string): Promise<LeaderboardData>;
  subscribeToUpdates(
    tournamentId: string,
    callback: (data: LeaderboardData) => void,
  ): () => void;
  refreshLeaderboard(tournamentId: string): Promise<LeaderboardData>;
}
```

#### Team Service

```typescript
interface ITeamService {
  createTeam(tournamentId: string, team: CreateTeamRequest): Promise<Team>;
  updateTeam(teamId: string, updates: UpdateTeamRequest): Promise<Team>;
  getUserTeam(tournamentId: string, userId: string): Promise<Team | null>;
}
```

### 4. Custom Hooks Strategy

#### Tournament State Management

```typescript
// Centralized tournament state logic
export function useTournamentState(tournamentId?: string) {
  return useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => tournamentService.getTournament(tournamentId!),
    enabled: !!tournamentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

#### Real-time Leaderboard

```typescript
// Optimized real-time updates
export function useLeaderboardUpdates(tournamentId: string) {
  const { data, refetch } = useQuery({
    queryKey: ["leaderboard", tournamentId],
    queryFn: () => leaderboardService.getLeaderboard(tournamentId),
    refetchInterval: (data) => {
      if (!data?.isActive) return false;
      return 3 * 60 * 1000; // 3 minutes for active tournaments
    },
  });

  const manualRefresh = useCallback(() => refetch(), [refetch]);

  return { data, manualRefresh };
}
```

#### Tournament Navigation

```typescript
// Simplified navigation logic
export function useTournamentNavigation() {
  const router = useRouter();

  const navigateToTournament = useCallback(
    (tournamentId: string, tour?: string) => {
      const params = new URLSearchParams();
      if (tour) params.set("tour", tour);
      router.push(`/tournament?id=${tournamentId}&${params.toString()}`);
    },
    [router],
  );

  return { navigateToTournament };
}
```

### 5. Component Refactoring Strategy

#### Page Components (Container Pattern)

```typescript
// Clean separation: Pages orchestrate, components render
export default function ActiveTournamentPage({ tournamentId }: Props) {
  const { tournament, isLoading, error } = useTournamentState(tournamentId);
  const { leaderboard, manualRefresh } = useLeaderboardUpdates(tournamentId);

  if (isLoading) return <TournamentPageSkeleton />;
  if (error) return <ErrorBoundary error={error} />;
  if (!tournament) return <TournamentNotFound />;

  return (
    <TournamentPageLayout>
      <TournamentHeader tournament={tournament} />
      <LiveUpdateStatus onRefresh={manualRefresh} />
      <LeaderboardDisplay leaderboard={leaderboard} />
    </TournamentPageLayout>
  );
}
```

#### Presentation Components (Pure Functions)

```typescript
// Pure, testable components focused on rendering
export const TournamentHeader = memo(({ tournament }: Props) => {
  return (
    <header className="tournament-header">
      <h1>{tournament.name}</h1>
      <TournamentMetadata tournament={tournament} />
    </header>
  );
});
```

### 6. Performance Optimization Plan

#### React Query Integration

- Replace direct store subscriptions with React Query
- Implement proper caching strategies
- Add optimistic updates for team management
- Use background refetching for real-time data

#### Component Optimization

- Implement `React.memo` for expensive components
- Use `useMemo` and `useCallback` strategically
- Virtualize large leaderboard lists
- Lazy load tournament history data

#### Bundle Optimization

- Code splitting by tournament state (active/past/upcoming)
- Dynamic imports for admin-only features
- Tree shaking for unused utilities

### 7. Type Safety Improvements

#### Domain-Specific Types

```typescript
// Tournament domain types
export interface TournamentMeta {
  readonly id: string;
  readonly name: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly status: TournamentStatus;
}

export interface ActiveTournament extends TournamentMeta {
  readonly status: "active";
  readonly currentRound: number;
  readonly livePlay: boolean;
}

export interface UpcomingTournament extends TournamentMeta {
  readonly status: "upcoming";
  readonly registrationDeadline: Date;
}
```

#### API Response Types

```typescript
// Strict API contract types
export interface LeaderboardResponse {
  tournament: TournamentMeta;
  teams: Team[];
  golfers: Golfer[];
  lastUpdated: string;
  metadata: {
    round: number;
    playComplete: boolean;
  };
}
```

### 8. Testing Strategy

#### Unit Testing

- Service layer: 100% coverage with mocked dependencies
- Hooks: Isolated testing with React Testing Library
- Components: Snapshot and interaction testing
- Utilities: Pure function testing

#### Integration Testing

- API integration with MSW (Mock Service Worker)
- Store integration with test providers
- Component integration with mock data

#### E2E Testing

- Critical user journeys (team creation, leaderboard viewing)
- Real-time update scenarios
- Error handling and edge cases

### 9. Error Handling & Resilience

#### Error Boundaries

```typescript
export class TournamentErrorBoundary extends Component {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    tournaentErrorService.logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <TournamentErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

#### Retry Logic

```typescript
// Exponential backoff for API failures
export const useRetryableQuery = (queryFn: QueryFunction, options: Options) => {
  return useQuery({
    ...options,
    retry: (failureCount, error) => {
      if (failureCount >= 3) return false;
      if (error.status >= 400 && error.status < 500) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
```

#### Graceful Degradation

- Offline mode for cached tournament data
- Fallback UI for failed leaderboard updates
- Progressive enhancement for real-time features

## Migration Strategy

### Phase 1: Foundation (Weeks 1-2)

1. **Service Layer Creation**

   - Implement tournament, leaderboard, and team services
   - Add proper TypeScript interfaces
   - Create service abstractions

2. **Store Refactoring**
   - Separate domain-specific stores
   - Implement proper normalization
   - Add store composition patterns

### Phase 2: Component Refactoring (Weeks 3-4)

1. **Hook Extraction**

   - Extract custom hooks from components
   - Implement data fetching hooks
   - Add state management hooks

2. **Component Simplification**
   - Convert to pure presentation components
   - Remove business logic from UI components
   - Implement container/component pattern

### Phase 3: Performance & Polish (Weeks 5-6)

1. **Performance Optimization**

   - Add React Query integration
   - Implement memoization strategies
   - Optimize bundle size

2. **Testing & Documentation**
   - Add comprehensive test suite
   - Update component documentation
   - Add integration tests

### Phase 4: Advanced Features (Weeks 7-8)

1. **Advanced State Management**

   - Implement optimistic updates
   - Add offline support
   - Enhanced error handling

2. **Developer Experience**
   - Add development tools
   - Improve debugging capabilities
   - Performance monitoring

## Success Metrics

### Code Quality

- **Cyclomatic Complexity**: Reduce from ~15 to <10 per function
- **Test Coverage**: Achieve >90% coverage across all modules
- **Bundle Size**: Reduce initial bundle by 20-30%
- **Type Safety**: 100% TypeScript strict mode compliance

### Performance

- **First Contentful Paint**: <1.5s (currently ~2.5s)
- **Time to Interactive**: <3s (currently ~4.5s)
- **API Response Time**: <500ms average
- **Real-time Update Latency**: <30s

### Developer Experience

- **Build Time**: Reduce by 25% through better code splitting
- **Hot Reload Time**: <2s for component changes
- **Debugging Efficiency**: 50% reduction in time to identify issues
- **New Developer Onboarding**: <1 day to understand architecture

### User Experience

- **Page Load Speed**: 40% improvement
- **Real-time Reliability**: >99% uptime for live updates
- **Error Recovery**: Graceful handling of 95% of error scenarios
- **Mobile Performance**: Lighthouse score >90

## Risk Mitigation

### Technical Risks

1. **Breaking Changes**

   - Mitigation: Feature flags and gradual rollout
   - Rollback plan: Maintain parallel implementations

2. **Performance Regression**

   - Mitigation: Comprehensive performance testing
   - Monitoring: Real-time performance metrics

3. **Data Consistency**
   - Mitigation: Proper state normalization
   - Validation: Comprehensive integration tests

### Business Risks

1. **Development Timeline**

   - Mitigation: Phased delivery approach
   - Contingency: Core functionality first priority

2. **User Disruption**
   - Mitigation: Backward compatibility during transition
   - Communication: Clear migration timeline

## Implementation Guidelines

### Code Standards

- **ESLint Configuration**: Strict rules for consistency
- **Prettier**: Automated code formatting
- **TypeScript**: Strict mode with no implicit any
- **Testing**: Jest + React Testing Library + MSW

### Documentation Requirements

- **Component Documentation**: Props, usage examples, accessibility
- **Service Documentation**: API contracts, error scenarios
- **Hook Documentation**: Parameters, return values, side effects
- **Architecture Documentation**: Decision records, patterns

### Review Process

- **Code Reviews**: All changes require approval
- **Architecture Reviews**: Major changes require design review
- **Performance Reviews**: Benchmark all optimization changes
- **Security Reviews**: Service layer and API changes

## Conclusion

This refactor represents a significant investment in the long-term maintainability and performance of the tournament module. By implementing proper separation of concerns, modern React patterns, and comprehensive testing, we'll create a more robust, scalable, and developer-friendly codebase.

The proposed architecture will:

- **Improve Developer Velocity**: Clear patterns and reduced complexity
- **Enhance User Experience**: Better performance and reliability
- **Reduce Maintenance Burden**: Cleaner code and better testing
- **Enable Future Growth**: Scalable architecture and clear extension points

The phased approach ensures minimal disruption while delivering incremental value throughout the migration process.
