# StandingsView Component Architecture

## Overview

The StandingsView component has been refactored to follow best practices with proper separation of concerns, improved type safety, and better data flow management.

## Architecture

### 📁 Directory Structure

```
StandingsView/
├── index.ts                 # Main barrel export
├── main.tsx                 # Main component orchestration
├── types/
│   └── index.ts            # Type definitions
├── hooks/
│   ├── index.ts            # Hook exports
│   ├── useStandingsData.ts # Data fetching logic
│   └── useFriendManagement.ts # Friend management logic
├── components/
│   ├── index.ts            # Component exports
│   ├── StandingsContent.tsx # Content router
│   ├── TourStandings.tsx   # Tour-specific standings
│   ├── PlayoffStandings.tsx # Playoff standings
│   ├── StandingsListing.tsx # Individual listing component
│   └── ...                 # Other UI components
└── utils/
    └── standingsHelpers.ts # Helper functions
```

### 🔄 Data Flow

```
StandingsView (main.tsx)
├── useStandingsData() ─────────────► Data fetching & processing
├── useFriendManagement() ──────────► Friend state management
├── StandingsHeader ────────────────► Header display
├── ToursToggle ────────────────────► Tour selection
└── StandingsContent ───────────────► Content routing
    ├── TourStandings ──────────────► Tour-specific display
    │   └── StandingsListing ───────► Individual entries
    └── PlayoffStandings ───────────► Playoff display
        └── StandingsListing ───────► Individual entries
```

## Key Features

### 🚀 Improved Data Management

- **Centralized Data Fetching**: All data fetching happens in `useStandingsData()`
- **Computed Properties**: Position changes and other calculations are computed once
- **Type Safety**: Strong typing with `ExtendedTourCard` and other interfaces
- **Error Handling**: Centralized error states and handling

### 🔧 Hooks

#### `useStandingsData()`

- Fetches all standings-related data
- Computes position changes and other derived properties
- Returns unified data structure with loading and error states

#### `useFriendManagement()`

- Manages friend addition/removal
- Handles optimistic updates
- Provides loading states for friend operations

### 🎨 Component Architecture

#### `StandingsView` (Main Component)

- **Single Responsibility**: Orchestrates data and state
- **Props**: `{ initialTourId?: string }`
- **State Management**: Tour selection, friend management
- **Data Flow**: Passes data down, handles actions up

#### `StandingsContent` (Router)

- Routes between tour and playoff views
- Filters data appropriately
- Maintains consistent interface

#### `TourStandings` / `PlayoffStandings`

- Specialized display components
- Use helper functions for data grouping
- Consistent prop interfaces

#### `StandingsListing`

- Variant-based rendering (`regular` | `playoff` | `bumped`)
- Proper friend state management
- Optimistic UI updates

### 🛠️ Utilities

#### `standingsHelpers.ts`

- `parsePosition()`: Parses position strings to numbers
- `groupTourStandings()`: Groups cards by cut lines
- `groupPlayoffStandings()`: Groups cards by playoff tiers
- `sortTourCardsByPoints()`: Sorts cards by points
- `filterTourCardsByTour()`: Filters cards by tour

## Types

### Core Types

```typescript
interface ExtendedTourCard extends TourCard {
  pastPoints?: number;
  posChange?: number;
  posChangePO?: number;
}

interface StandingsData {
  tours: Tour[];
  tiers: Tier[];
  tourCards: ExtendedTourCard[];
  currentTourCard: ExtendedTourCard | null;
  currentMember: Member | null;
  teams: Team[];
  tournaments: Tournament[];
  seasonId: string;
}

interface StandingsState {
  data: StandingsData | null;
  isLoading: boolean;
  error: Error | null;
}
```

## Usage

```typescript
// Basic usage
<StandingsView />

// With initial tour selection
<StandingsView initialTourId="tour-123" />

// Using hooks directly
const { data, isLoading, error } = useStandingsData();
const friendManagement = useFriendManagement(currentMember);
```

## Best Practices Implemented

1. **Separation of Concerns**: Clear separation between data, state, and UI
2. **Single Responsibility**: Each component has one clear purpose
3. **Type Safety**: Strong typing throughout the component tree
4. **Error Boundaries**: Proper error handling and user feedback
5. **Performance**: Memoization and efficient re-renders
6. **Maintainability**: Clear structure and documentation
7. **Testability**: Isolated concerns make testing easier

## Migration Notes

- `useCurrentStandings()` has been replaced with `useStandingsData()`
- Friend management is now handled by `useFriendManagement()`
- Component props have been simplified and made more consistent
- All data processing now happens at the top level

This refactored architecture provides a more maintainable, type-safe, and performant standings component system.
