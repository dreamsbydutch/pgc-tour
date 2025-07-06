# Streamlined Hooks Refactor Plan

## 🎯 Objective

Create a minimal, efficient hooks suite with maximum utility abstraction and only the essential hooks you need for your golf tournament application.

---

## 📊 Current State Analysis

### Current Files (2,669 lines total)

- `useTeamsHooks.tsx` - 580+ lines (3 hooks)
- `useTournamentHooks.tsx` - 737+ lines (18+ hooks)
- `useTourCardHooks.tsx` - 1079+ lines (19+ hooks)
- `useToast.ts` - 192 lines (keep as-is)
- `useUser.ts` - 11 lines (keep as-is)
- `usePWAInstall.ts` - 67 lines (keep as-is)

### Issues with Current Implementation

1. **Hook Explosion**: 40+ hooks for simple data operations
2. **Massive Duplication**: Same logic repeated across files
3. **Poor Abstraction**: Business logic mixed in hooks instead of utils
4. **Type Redundancy**: Same types defined multiple times
5. **Inefficient Caching**: Inconsistent query configurations

---

## 🎯 Target Hook Suite (Final State)

### Core Hooks (8 total hooks)

#### **1. Tournament Navigation Hooks**

```typescript
export function useCurrentTournament(): Tournament | null;
export function useNextTournament(): Tournament | null;
export function usePreviousTournament(): Tournament | null;
export function useUpcomingTournaments(seasonId?: string): Tournament[];
export function usePreviousTournaments(seasonId?: string): Tournament[];
```

#### **2. Leaderboard Hooks**

```typescript
export function useLeaderboard(
  tournamentId: string,
  options?: { live?: boolean },
): LeaderboardResult;

export function useHistoricalLeaderboard(
  tournamentId: string,
  seasonId?: string,
): LeaderboardResult;
```

#### **3. Champions Hook**

```typescript
export function useRecentChampions(daysLimit?: number): ChampionsResult;
```

#### **4. Seasonal Data Hooks**

```typescript
export function useTournamentsBySeason(seasonId?: string): Tournament[];
export function useTourCardsBySeason(seasonId?: string): TourCard[];
export function useTourCardsByTour(
  tourId: string,
  seasonId?: string,
): TourCard[];
export function useTourCardsByMember(
  memberId: string,
  seasonId?: string,
): TourCard[];
```

### Target Metrics

- **From 2,669 lines → ~800 lines** (70% reduction)
- **From 40+ hooks → 8 hooks** (80% reduction)
- **100% utility abstraction** for business logic
- **Centralized types** from `/lib/types`

---

## 📋 Phase-by-Phase Refactor Plan

## Phase 1: Foundation Setup (Day 1)

### Step 1.1: Create New Hook Architecture Files

**Files to Create:**

```typescript
// src/lib/hooks/useTournaments.ts
export {
  useCurrentTournament,
  useNextTournament,
  usePreviousTournament,
  useUpcomingTournaments,
  usePreviousTournaments,
  useTournamentsBySeason,
};

// src/lib/hooks/useLeaderboards.ts
export { useLeaderboard, useHistoricalLeaderboard };

// src/lib/hooks/useChampions.ts
export { useRecentChampions };

// src/lib/hooks/useTourCards.ts
export { useTourCardsBySeason, useTourCardsByTour, useTourCardsByMember };
```

### Step 1.2: Create Hook-Specific Types

```typescript
// src/lib/hooks/types/results.ts
export interface LeaderboardResult extends BaseHookResult {
  tournament: Tournament;
  teams: EnrichedTeam[];
  teamsByTour: TourGroup[];
  totalTeams: number;
  lastUpdated?: Date;
  isLive?: boolean;
}

export interface ChampionsResult extends BaseHookResult {
  tournament: Tournament;
  champions: EnrichedTeam[];
  daysRemaining?: number;
}

// More specific result types...
```

---

## Phase 2: Tournament Hooks Implementation (Day 2)

### Step 2.1: Implement Core Tournament Navigation

```typescript
// src/lib/hooks/useTournaments.ts

import { useSeasonalStore } from "../store/seasonalStore";
import { golf, processing, validation } from "@/lib/utils";
import { api } from "@/src/trpc/react";
import type { Tournament } from "@prisma/client";

/**
 * Returns the current active tournament
 */
export function useCurrentTournament(): Tournament | null {
  const tournaments = useSeasonalStore((state) => state.tournaments);

  return useMemo(() => {
    if (!tournaments) return null;

    return (
      processing.findByPredicate(
        tournaments,
        (tournament) =>
          golf.getTournamentStatus(
            new Date(tournament.startDate),
            new Date(tournament.endDate),
          ) === "current",
      ) || null
    );
  }, [tournaments]);
}

/**
 * Returns the next upcoming tournament
 */
export function useNextTournament(): Tournament | null {
  const tournaments = useSeasonalStore((state) => state.tournaments);

  return useMemo(() => {
    if (!tournaments) return null;

    const upcoming = processing.filterByPredicate(
      tournaments,
      (tournament) =>
        golf.getTournamentStatus(
          new Date(tournament.startDate),
          new Date(tournament.endDate),
        ) === "upcoming",
    );

    return (
      processing.sortBy(upcoming, [
        { key: "startDate", direction: "asc" },
      ])[0] || null
    );
  }, [tournaments]);
}

/**
 * Returns all upcoming tournaments for current or specified season
 */
export function useUpcomingTournaments(seasonId?: string): Tournament[] {
  const tournaments = useSeasonalStore((state) => state.tournaments);
  const currentSeason = useSeasonalStore((state) => state.season);

  return useMemo(() => {
    if (!tournaments) return [];

    const targetSeasonId = seasonId || currentSeason?.id;
    if (!targetSeasonId) return [];

    const filtered = processing.filterByPredicate(tournaments, (tournament) => {
      const isCorrectSeason = tournament.seasonId === targetSeasonId;
      const isUpcoming =
        golf.getTournamentStatus(
          new Date(tournament.startDate),
          new Date(tournament.endDate),
        ) === "upcoming";

      return isCorrectSeason && isUpcoming;
    });

    return processing.sortBy(filtered, [
      { key: "startDate", direction: "asc" },
    ]);
  }, [tournaments, seasonId, currentSeason?.id]);
}

/**
 * Returns tournaments by season (from store if current, API if historical)
 */
export function useTournamentsBySeason(seasonId?: string): Tournament[] {
  const currentSeason = useSeasonalStore((state) => state.season);
  const tournaments = useSeasonalStore((state) => state.tournaments);

  const isCurrentSeason = seasonId === currentSeason?.id || !seasonId;

  // Use store data for current season
  const storeData = useMemo(() => {
    if (!isCurrentSeason || !tournaments) return [];
    return tournaments;
  }, [isCurrentSeason, tournaments]);

  // Fetch from API for historical seasons
  const { data: apiData = [] } = api.tournament.getBySeason.useQuery(
    { seasonId: seasonId! },
    {
      enabled: !isCurrentSeason && !!seasonId,
      staleTime: 1000 * 60 * 30, // 30 minutes cache for historical data
    },
  );

  return isCurrentSeason ? storeData : apiData;
}
```

### Step 2.2: Abstract Tournament Processing Logic

Move complex logic to utils:

```typescript
// src/lib/utils/domain/tournaments.ts (NEW)

export const tournamentUtils = {
  /**
   * Get tournament by status from a list
   */
  getByStatus(
    tournaments: Tournament[],
    status: TournamentStatus,
  ): Tournament[] {
    return processing.filterByPredicate(
      tournaments,
      (tournament) =>
        golf.getTournamentStatus(
          new Date(tournament.startDate),
          new Date(tournament.endDate),
        ) === status,
    );
  },

  /**
   * Get the next tournament chronologically
   */
  getNext(tournaments: Tournament[]): Tournament | null {
    const upcoming = this.getByStatus(tournaments, "upcoming");
    return (
      processing.sortBy(upcoming, [
        { key: "startDate", direction: "asc" },
      ])[0] || null
    );
  },

  /**
   * Get the most recent completed tournament
   */
  getPrevious(tournaments: Tournament[]): Tournament | null {
    const completed = this.getByStatus(tournaments, "completed");
    return (
      processing.sortBy(completed, [
        { key: "endDate", direction: "desc" },
      ])[0] || null
    );
  },
};
```

---

## Phase 3: Leaderboard Hooks Implementation (Day 3)

### Step 3.1: Unified Leaderboard Hook

```typescript
// src/lib/hooks/useLeaderboards.ts

import { api } from "@/src/trpc/react";
import { useSeasonalStore } from "../store/seasonalStore";
import { teams, validation } from "@/lib/utils";
import { getOptimizedQueryConfig } from "@/lib/utils/system/queries";
import type { LeaderboardResult } from "@/lib/types";

/**
 * Universal leaderboard hook - works for current (live) and historical tournaments
 */
export function useLeaderboard(
  tournamentId: string,
  options: { live?: boolean } = {},
): LeaderboardResult {
  const tours = useSeasonalStore((state) => state.tours);
  const tourCards = useSeasonalStore((state) => state.allTourCards);

  // Get tournament data
  const { data: tournament, isLoading: tournamentLoading } =
    api.tournament.getById.useQuery(
      { tournamentId },
      { enabled: !!tournamentId },
    );

  // Determine if this is a live tournament
  const isLiveTournament =
    tournament &&
    golf.getTournamentStatus(
      new Date(tournament.startDate),
      new Date(tournament.endDate),
    ) === "current";

  // Configure query based on live status
  const shouldRefresh = options.live && isLiveTournament;
  const queryConfig = getOptimizedQueryConfig(shouldRefresh);

  // Get teams data
  const {
    data: rawTeams,
    isLoading: teamsLoading,
    error: teamsError,
  } = api.team.getByTournament.useQuery(
    { tournamentId },
    {
      ...queryConfig,
      enabled: !!tournamentId,
    },
  );

  // Get golfers data for live tournaments
  const { data: golfers } = api.golfer.getByTournament.useQuery(
    { tournamentId },
    {
      enabled: shouldRefresh && !!tournamentId,
      ...queryConfig,
    },
  );

  return useMemo(() => {
    // Handle loading states
    if (tournamentLoading || teamsLoading) {
      return {
        tournament: null,
        teams: [],
        teamsByTour: [],
        totalTeams: 0,
        isLoading: true,
        error: null,
        isLive: false,
      };
    }

    // Handle errors
    if (teamsError || !tournament) {
      return {
        tournament: null,
        teams: [],
        teamsByTour: [],
        totalTeams: 0,
        isLoading: false,
        error: teamsError?.message || "Tournament not found",
        isLive: false,
      };
    }

    // Validate required data
    const dataError = validation.validateRequiredData([
      { name: "tours", data: tours || [] },
      { name: "tour cards", data: tourCards || [] },
    ]);

    if (dataError) {
      return {
        tournament,
        teams: [],
        teamsByTour: [],
        totalTeams: 0,
        isLoading: false,
        error: dataError,
        isLive: isLiveTournament,
      };
    }

    // Enrich teams with full data
    const enrichedTeams = teams.enrichTeamsWithRelations(
      rawTeams || [],
      tours || [],
      tourCards || [],
      { golfers, sortGolfers: true },
    );

    // Group by tour
    const teamsByTour = teams.groupTeamsByProperty(enrichedTeams);

    return {
      tournament,
      teams: enrichedTeams,
      teamsByTour,
      totalTeams: rawTeams?.length || 0,
      isLoading: false,
      error: null,
      isLive: isLiveTournament,
      lastUpdated: new Date(),
    };
  }, [
    tournament,
    rawTeams,
    golfers,
    tours,
    tourCards,
    tournamentLoading,
    teamsLoading,
    teamsError,
    isLiveTournament,
  ]);
}

/**
 * Specialized hook for historical leaderboards across seasons
 */
export function useHistoricalLeaderboard(
  tournamentId: string,
  seasonId?: string,
): LeaderboardResult {
  // Similar implementation but optimized for historical data
  // Uses longer cache times, no live refresh
  // Falls back to cross-season API calls if needed
}
```

---

## Phase 4: Champions & TourCards Hooks (Day 4)

### Step 4.1: Champions Hook

```typescript
// src/lib/hooks/useChampions.ts

export function useRecentChampions(daysLimit: number = 3): ChampionsResult {
  const tournaments = useSeasonalStore((state) => state.tournaments);
  const tours = useSeasonalStore((state) => state.tours);
  const tourCards = useSeasonalStore((state) => state.allTourCards);

  // Find the most recent completed tournament
  const recentTournament = useMemo(() => {
    if (!tournaments) return null;

    const completed = processing.filterByPredicate(
      tournaments,
      (tournament) => {
        const status = golf.getTournamentStatus(
          new Date(tournament.startDate),
          new Date(tournament.endDate),
        );
        return status === "completed";
      },
    );

    return (
      processing.sortBy(completed, [
        { key: "endDate", direction: "desc" },
      ])[0] || null
    );
  }, [tournaments]);

  // Validate tournament timing
  const validationResult = useMemo(() => {
    if (!recentTournament)
      return { isValid: false, error: "No recent tournament" };

    return validation.validateTournamentWindow(recentTournament, daysLimit);
  }, [recentTournament, daysLimit]);

  // Get champion teams if validation passes
  const {
    data: championTeams,
    isLoading,
    error: apiError,
  } = api.team.getChampionsByTournament.useQuery(
    { tournamentId: recentTournament!.id },
    {
      enabled: validationResult.isValid && !!recentTournament,
      staleTime: 1000 * 60 * 5, // 5 minute cache
    },
  );

  return useMemo(() => {
    if (!validationResult.isValid) {
      return {
        tournament: recentTournament,
        champions: [],
        error: validationResult.error,
        isLoading: false,
        daysRemaining: validationResult.daysRemaining,
      };
    }

    if (isLoading) {
      return {
        tournament: recentTournament,
        champions: [],
        error: null,
        isLoading: true,
        daysRemaining: validationResult.daysRemaining,
      };
    }

    if (apiError || !championTeams) {
      return {
        tournament: recentTournament,
        champions: [],
        error: apiError?.message || "Failed to load champions",
        isLoading: false,
        daysRemaining: validationResult.daysRemaining,
      };
    }

    // Enrich champion teams
    const enrichedChampions = teams.enrichTeamsWithRelations(
      championTeams,
      tours || [],
      tourCards || [],
    );

    return {
      tournament: recentTournament,
      champions: enrichedChampions,
      error: null,
      isLoading: false,
      daysRemaining: validationResult.daysRemaining,
    };
  }, [
    recentTournament,
    championTeams,
    tours,
    tourCards,
    validationResult,
    isLoading,
    apiError,
  ]);
}
```

### Step 4.2: TourCards Hooks

```typescript
// src/lib/hooks/useTourCards.ts

/**
 * Get tour cards by season - store for current, API for historical
 */
export function useTourCardsBySeason(seasonId?: string): TourCard[] {
  const currentSeason = useSeasonalStore((state) => state.season);
  const storeTourCards = useSeasonalStore((state) => state.allTourCards);

  const isCurrentSeason = seasonId === currentSeason?.id || !seasonId;

  // Use store for current season
  if (isCurrentSeason) {
    return storeTourCards || [];
  }

  // Fetch from API for historical seasons
  const { data = [] } = api.tourCard.getBySeason.useQuery(
    { seasonId: seasonId! },
    {
      enabled: !!seasonId,
      staleTime: 1000 * 60 * 30, // 30 minutes cache
    },
  );

  return data;
}

/**
 * Get tour cards by tour - filtered from season data
 */
export function useTourCardsByTour(
  tourId: string,
  seasonId?: string,
): TourCard[] {
  const seasonTourCards = useTourCardsBySeason(seasonId);

  return useMemo(() => {
    return processing.filterByPredicate(
      seasonTourCards,
      (tourCard) => tourCard.tourId === tourId,
    );
  }, [seasonTourCards, tourId]);
}

/**
 * Get tour cards by member - across all tours in season
 */
export function useTourCardsByMember(
  memberId: string,
  seasonId?: string,
): TourCard[] {
  const seasonTourCards = useTourCardsBySeason(seasonId);

  return useMemo(() => {
    return processing.filterByPredicate(
      seasonTourCards,
      (tourCard) => tourCard.memberId === memberId,
    );
  }, [seasonTourCards, memberId]);
}
```

---

## Phase 5: Cleanup & Integration (Day 5)

### Step 5.1: Create Main Hooks Index

```typescript
// src/lib/hooks/index.ts

// Tournament navigation
export {
  useCurrentTournament,
  useNextTournament,
  usePreviousTournament,
  useUpcomingTournaments,
  usePreviousTournaments,
  useTournamentsBySeason,
} from "./useTournaments";

// Leaderboards
export { useLeaderboard, useHistoricalLeaderboard } from "./useLeaderboards";

// Champions
export { useRecentChampions } from "./useChampions";

// Tour cards
export {
  useTourCardsBySeason,
  useTourCardsByTour,
  useTourCardsByMember,
} from "./useTourCards";

// Keep existing utility hooks
export { useToast } from "./useToast";
export { useUser } from "./useUser";
export { usePWAInstall } from "./usePWAInstall";
```

### Step 5.2: Remove Old Files

```bash
# Files to delete after migration
src/lib/hooks/useTeamsHooks.tsx     # 580 lines → deleted
src/lib/hooks/useTournamentHooks.tsx # 737 lines → deleted
src/lib/hooks/useTourCardHooks.tsx   # 1079 lines → deleted
```

### Step 5.3: Update Component Imports

**Migration Script Pattern:**

```typescript
// OLD (40+ different imports)
import {
  useCurrentTournament,
  useNextTournament,
  useUpcomingTournaments,
  // ... 35+ more imports
} from "@/lib/hooks/useTournamentHooks";

// NEW (8 focused imports)
import {
  useCurrentTournament,
  useLeaderboard,
  useRecentChampions,
} from "@/lib/hooks";
```

---

## 📊 Expected Results

### Quantitative Improvements

- **From 2,669 lines → ~800 lines** (70% reduction)
- **From 40+ hooks → 8 hooks** (80% reduction)
- **From 6 files → 4 files** (33% reduction)
- **100% business logic** moved to utils

### Qualitative Improvements

- **Single Responsibility**: Each hook has one clear purpose
- **Maximum Abstraction**: All business logic in utils
- **Consistent Patterns**: Same result types and error handling
- **Smart Caching**: Optimized for current vs historical data
- **Type Safety**: Full TypeScript integration with centralized types

### Performance Benefits

- **Reduced Bundle Size**: 70% smaller hook modules
- **Better Tree Shaking**: Clean ES module exports
- **Optimized Queries**: Smart caching based on data volatility
- **Eliminated Re-renders**: Proper memoization only where needed

---

## 🚀 Migration Strategy

### Component Update Pattern

```typescript
// BEFORE: Multiple specific hooks
const currentTournament = useCurrentTournament();
const teams = useCurrentLeaderboard();
const champions = useLatestChampions();

// AFTER: Single optimized hooks
const currentTournament = useCurrentTournament();
const leaderboard = useLeaderboard(tournamentId, { live: true });
const champions = useRecentChampions();
```

### Benefits for Components

1. **Cleaner Imports**: Single source for all hook needs
2. **Better Performance**: Optimized queries and caching
3. **Consistent APIs**: Same result patterns across all hooks
4. **Easier Testing**: Simplified hook dependencies

---

## 📋 Implementation Checklist

### Phase 1 - Foundation (Day 1)

- [ ] Create new hook files structure
- [ ] Set up hook-specific types
- [ ] Create utility abstractions

### Phase 2 - Tournament Hooks (Day 2)

- [ ] Implement tournament navigation hooks
- [ ] Abstract tournament logic to utils
- [ ] Test tournament status and filtering

### Phase 3 - Leaderboard Hooks (Day 3)

- [ ] Implement unified leaderboard hook
- [ ] Add live/historical data handling
- [ ] Test team enrichment and grouping

### Phase 4 - Champions & TourCards (Day 4)

- [ ] Implement champions hook with timing validation
- [ ] Create tour card hooks with season handling
- [ ] Test cross-season data fetching

### Phase 5 - Cleanup (Day 5)

- [ ] Create main hooks index
- [ ] Delete old hook files
- [ ] Update all component imports
- [ ] Run full test suite
- [ ] Performance benchmarking

---

## 🎯 Success Criteria

- ✅ **8 hooks maximum** (vs current 40+)
- ✅ **100% utility abstraction** for business logic
- ✅ **Consistent result patterns** across all hooks
- ✅ **Smart caching strategy** for current vs historical data
- ✅ **Full TypeScript integration** with centralized types
- ✅ **70% code reduction** while maintaining all functionality

This plan creates a focused, efficient hooks suite that leverages your existing utils infrastructure and provides exactly the functionality you need without the bloat.
