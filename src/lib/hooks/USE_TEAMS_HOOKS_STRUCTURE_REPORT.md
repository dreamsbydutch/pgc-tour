# useTeamsHooks.tsx Structure & Functionality Report

## 📁 File Overview

The `useTeamsHooks.tsx` file contains three specialized React hooks for managing tournament team data in the golf tournament application. This file has been completely refactored to leverage the new utils suite and provides robust error handling, efficient data processing, and optimal performance.

## 🏗️ File Structure

### 1. **Imports & Dependencies**

```typescript
// Core dependencies
import { api } from "@/src/trpc/react";
import { useSeasonalStore } from "../store/seasonalStore";
import { useCurrentTournament, useLastTournament } from "./useTournamentHooks";

// New utils suite integration
import { golf, dates, processing } from "@/lib/utils";
import { groupBy, hasItems, isEmpty, isDefined } from "@/lib/utils/core/index";

// Type definitions
import type { Tournament, Team, Tour, TourCard, Golfer } from "@prisma/client";
```

### 2. **TypeScript Interfaces**

- `BaseHookResult` - Common structure for all hook returns
- `ChampionsResult` - Return type for champions data
- `LeaderboardResult` - Return type for leaderboard data
- `TournamentLeaderboardResult` - Extended result with tournament status
- `EnrichedTeam` - Team data enriched with tour and tourCard info
- `TourGroup` - Teams grouped by tour

**Proper Database Types**:

- `MinimalTour` - Properly typed tour data from seasonal store
- `MinimalTourCard` - Properly typed tour card data from seasonal store
- `MinimalTournament` - Properly typed tournament data with course and tier relations

### 3. **Utility Helper Functions**

- `validateSeasonalData()` - Validates tours and tourCards availability
- `validateChampionWindow()` - Validates tournament timing for champions display
- `enrichTeamsWithTourData()` - Enriches teams with tour/tourCard data
- `groupTeamsByTour()` - Groups teams by tour with sorting
- `getQueryConfig()` - Smart query configuration based on tournament status

### 4. **Exported Hook Functions**

- `useLatestChampions()` - Champions of the most recent tournament
- `useCurrentLeaderboard()` - Live leaderboard for active tournaments
- `useTournamentLeaderboard()` - Universal leaderboard for any tournament

## 🎯 Exported Hooks Detailed Functionality

### `useLatestChampions()`

**Purpose**: Returns champion teams from the most recent tournament, but only within a 3-day window after tournament completion.

**Key Features**:

- ✅ **3-Day Window Validation**: Only shows champions for 3 days after tournament ends
- ✅ **Comprehensive Validation**: Checks for tournament data, seasonal data availability
- ✅ **Smart Error Handling**: Different error messages for different failure scenarios
- ✅ **Days Remaining Counter**: Shows how many days left in the champion display window

**Return Structure**:

```typescript
{
  tournament?: MinimalTournament;  // Properly typed tournament data with course/tier
  champs: EnrichedTeam[];          // Array of champion teams with tour/tourCard data
  daysRemaining?: number;          // Days remaining in champion display window
  error: string | null;            // Error message or null
  isLoading: boolean;              // Loading state
}
```

**Use Cases**:

- Homepage champion display
- Recent winners showcase
- Tournament recap pages

---

### `useCurrentLeaderboard()`

**Purpose**: Provides real-time leaderboard data for the currently active tournament with automatic updates.

**Key Features**:

- ✅ **Real-Time Updates**: Refreshes every 2 minutes during active tournaments
- ✅ **Tournament Status Validation**: Only works for "current" tournaments
- ✅ **Teams Grouped by Tour**: Organizes teams by their respective tours
- ✅ **Background Refresh**: Continues updating even when tab is inactive
- ✅ **Enriched Team Data**: Includes tour, tourCard, and optional golfer information

**Return Structure**:

```typescript
{
  tournament?: MinimalTournament;  // Properly typed current tournament data
  teamsByTour: TourGroup[];        // Teams organized by tour
  totalTeams: number;              // Total number of teams
  lastUpdated?: Date;              // Timestamp of last data fetch
  error: string | null;            // Error message or null
  isLoading: boolean;              // Loading state
}
```

**Performance Features**:

- 🔄 2-minute refresh interval for live data
- 📱 Background refresh support
- 🎯 Window focus refresh
- 🔁 3 retry attempts on failure

**Use Cases**:

- Live tournament leaderboard
- Real-time scoring displays
- Active tournament monitoring

---

### `useTournamentLeaderboard(tournamentId: string | undefined)`

**Purpose**: Universal leaderboard hook that works for past, current, and future tournaments with intelligent caching strategies.

**Key Features**:

- ✅ **Universal Coverage**: Works for any tournament (past/current/future)
- ✅ **Smart Caching**: Different cache strategies based on tournament status
- ✅ **Comprehensive Status Tracking**: Detailed status reporting ('loading', 'success', 'error', 'empty')
- ✅ **Edge Case Handling**: Handles no teams, missing data, network errors
- ✅ **Tournament Status Detection**: Automatically determines if tournament is upcoming/current/completed

**Return Structure**:

```typescript
{
  tournament?: Tournament;     // Full tournament data
  teamsByTour: TourGroup[];   // Teams organized by tour
  totalTeams?: number;        // Total number of teams
  lastUpdated?: Date;         // Timestamp of last data fetch
  status: 'loading' | 'success' | 'error' | 'empty';  // Detailed status
  tournamentStatus?: string;  // Tournament timing status
  message?: string;           // Contextual message for empty states
  error: string | null;       // Error message or null
  isLoading: boolean;         // Loading state
}
```

**Caching Strategy**:

```typescript
// Active tournaments (frequent updates)
staleTime: 1 minute
refetchInterval: 2 minutes
gcTime: 5 minutes

// Completed tournaments (longer cache)
staleTime: 30 minutes
gcTime: 1 hour
```

**Use Cases**:

- Tournament history pages
- Specific tournament leaderboards
- Tournament preview pages
- Administrative dashboards

## 🛠️ Helper Functions Deep Dive

### Type Safety & Database Integration

All helper functions now use **properly typed interfaces** derived from the database schema:

```typescript
// Properly typed minimal interfaces matching the seasonal store
type MinimalTour = {
  id: string;
  name: string;
  logoUrl: string;
  buyIn: number;
  shortForm: string;
  seasonId: string;
};

type MinimalTourCard = {
  id: string;
  memberId: string;
  tourId: string;
  seasonId: string;
  displayName: string;
  earnings: number;
  points: number;
  position: string | null;
};

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
  tier: { id: string; name: string; seasonId: string };
};
```

### `validateSeasonalData(tours: MinimalTour[], tourCards: MinimalTourCard[])`

Ensures required seasonal data is available before processing teams.

### `validateChampionWindow(tournament: MinimalTournament)`

Validates tournament timing for champion display (3-day window after completion).

### `enrichTeamsWithTourData(teams: Team[], tours: MinimalTour[], tourCards: MinimalTourCard[], golfers?: Golfer[])`

Enriches team data with:

- Associated tour information
- Tour card details
- Sorted golfer data (when available)
- Filters out incomplete entries

### `groupTeamsByTour(enrichedTeams)`

Groups teams by tour and applies:

- Position-based sorting within each tour
- Tour name alphabetical sorting
- Team count tracking per tour

### `getQueryConfig(isActive)`

Returns optimized query configuration:

- Active tournaments: Aggressive caching with frequent updates
- Completed tournaments: Conservative caching for performance

## 🎯 Key Benefits

### **Performance**

- Smart caching strategies reduce unnecessary API calls
- Efficient data processing using optimized utils
- Background refresh capabilities
- Proper loading state management

### **Reliability**

- Comprehensive error handling at every level
- Input validation and sanitization
- **Complete Type Safety** - Zero `any` types, all data properly typed from database schema
- Graceful degradation for missing data

### **Developer Experience**

- Clear TypeScript interfaces
- Comprehensive JSDoc documentation
- Consistent error patterns
- Easy to test and extend

### **User Experience**

- Real-time updates for active tournaments
- Informative error messages
- Smooth loading states
- Contextual status information

## 🔄 Data Flow

1. **Input Validation** → Validate tournament ID, seasonal data
2. **Tournament Status Detection** → Determine if upcoming/current/completed
3. **Query Configuration** → Apply appropriate caching strategy
4. **Data Fetching** → Fetch teams with error handling
5. **Data Enrichment** → Add tour/tourCard information
6. **Data Organization** → Group by tour, sort by position
7. **Result Assembly** → Return formatted result with status

This architecture ensures optimal performance, reliability, and maintainability while providing a superior developer and user experience.

## 🎯 Type Safety Achievement

### ✅ **Zero `any` Types**

The hooks file has been completely refactored to eliminate all `any` types, ensuring:

- **Database Schema Compliance**: All types match the actual database structure
- **Compile-Time Safety**: TypeScript catches type errors at build time
- **IntelliSense Support**: Full autocomplete and type checking in IDEs
- **Runtime Reliability**: Prevents type-related runtime errors

### **Before vs After**:

```typescript
// ❌ Before: Unsafe any types
tournament?: any;
tours: any[];
tourCards: any[];

// ✅ After: Properly typed from database schema
tournament?: MinimalTournament;
tours: MinimalTour[];
tourCards: MinimalTourCard[];
```

### **Benefits**:

- 🛡️ **Type Safety**: Catches errors at compile time
- 🎯 **Accuracy**: Ensures data structure compliance
- 📝 **Documentation**: Types serve as inline documentation
- 🔧 **Maintainability**: Easier refactoring and debugging
