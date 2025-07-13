# HomePageListings Component

A comprehensive, well-architected React component system for displaying tournament standings and leaderboards on the home page.

## Architecture Overview

This component follows a strict separation of concerns with the following structure:

```
HomePageListings/
├── components/          # Pure UI components
├── hooks/              # Custom React hooks for state management
├── utils/              # Utility functions, business logic, types, and constants
│   ├── index.ts        # Data transformation utilities
│   ├── businessLogic.ts # Domain-specific business logic
│   ├── types.ts        # TypeScript type definitions
│   └── constants.ts    # Application constants and configuration
├── index.ts            # Main entry point and exports
└── README.md           # This documentation
```

## Separation of Concerns

### 1. **Components** (`/components/`)

- **Purpose**: Pure UI components focused only on rendering
- **Responsibilities**:
  - Render JSX
  - Handle user interactions (clicking, etc.)
  - Apply styling and layout
- **What they DON'T do**:
  - Business logic
  - Data transformation
  - API calls
  - Complex state management

### 2. **Hooks** (`/hooks/`)

- **Purpose**: Custom React hooks for state management and side effects
- **Responsibilities**:
  - Manage component state
  - Handle side effects (API calls, etc.)
  - Provide clean interfaces for components
- **Key hooks**:
  - `useHomePageListings`: Manages view state (standings/leaderboard)
  - `useStandingsData`: Fetches and manages standings data
  - `useLeaderboardData`: Fetches and manages leaderboard data

### 3. **Types** (`/types.ts`)

- **Purpose**: Centralized TypeScript type definitions
- **Responsibilities**:
  - Define all interfaces and types
  - Ensure type safety across the component
  - Document data structures

### 4. **Constants** (`/constants.ts`)

- **Purpose**: Application configuration and magic numbers
- **Responsibilities**:
  - Define reusable constants
  - Centralize configuration values
  - Avoid magic numbers/strings in code
- **Key constants**:
  - `MAX_TEAMS_DISPLAY`: Maximum teams shown per tour
  - `DEFAULT_VIEW_TYPE`: Default view on load
  - `MAJOR_TOURNAMENTS`: Tournament names for championship badges
  - `UI_CONSTANTS`: UI-related constants (logo sizes, etc.)

### 5. **Utils** (`/utils/`)

- **Purpose**: Business logic and data transformation
- **Responsibilities**:
  - Transform data for display
  - Implement business rules
  - Provide reusable utility functions
- **Key files**:
  - `index.ts`: Data transformation utilities
  - `businessLogic.ts`: Domain-specific business logic (champion filtering, etc.)

## Usage

### Basic Usage

```tsx
import { HomePageListingsContainer } from "@/lib/components/HomePageListings";

function HomePage() {
  return (
    <HomePageListingsContainer
      activeView="standings" // or "leaderboard"
    />
  );
}
```

### Advanced Usage with Hooks

```tsx
import {
  HomePageListingsContainer,
  useHomePageListings,
  DEFAULT_VIEW_TYPE,
} from "@/lib/components/HomePageListings";

function HomePage() {
  const { activeView, handleViewChange } =
    useHomePageListings(DEFAULT_VIEW_TYPE);

  return (
    <div>
      <button onClick={() => handleViewChange("standings")}>Standings</button>
      <button onClick={() => handleViewChange("leaderboard")}>
        Leaderboard
      </button>
      <HomePageListingsContainer activeView={activeView} />
    </div>
  );
}
```

## Data Flow

1. **Data Fetching**: Hooks (`useStandingsData`, `useLeaderboardData`) fetch data from APIs
2. **Data Transformation**: Utils transform raw data into display format
3. **Business Logic**: Business logic utils apply domain rules (champion filtering, etc.)
4. **Rendering**: Components receive clean, transformed data and render UI

## Key Features

- **Performance**: Aggressive caching and optimized re-renders
- **Type Safety**: Comprehensive TypeScript definitions
- **Maintainability**: Clear separation of concerns
- **Testability**: Each layer can be tested independently
- **Reusability**: Components and hooks can be used elsewhere

## Design Principles

1. **Single Responsibility**: Each file/function has one clear purpose
2. **Dependency Inversion**: Components depend on abstractions (hooks), not implementations
3. **Don't Repeat Yourself**: Common logic is extracted to utils
4. **Fail Fast**: Use TypeScript for early error detection
5. **Performance First**: Optimize for minimal re-renders and fast loading

## Testing Strategy

- **Components**: Test rendering and user interactions
- **Hooks**: Test state management and side effects
- **Utils**: Test data transformations and business logic
- **Integration**: Test data flow from hooks to components

## Future Improvements

- Add virtualization for large lists
- Implement error boundaries
- Add loading states for individual tours
- Consider adding animation/transitions
- Add accessibility improvements (ARIA labels, etc.)

This architecture ensures the HomePageListings component is maintainable, testable, and performant while following React and TypeScript best practices.

Main container component that handles data fetching and view management.

**Props:**

- `defaultView`: Initial view type ('standings' or 'leaderboard', default: 'standings')
- `showToggle`: Whether to show the toggle button (default: true)

### HomePageListingsToggle

Toggle component for switching between standings and leaderboard views.

**Props:**

- `activeView`: Current active view
- `onViewChange`: Callback for view changes

### HomePageList

Shared list component used by both standings and leaderboard views.

### HomePageListSkeleton

Loading skeleton component for better UX during data fetching.

## Hooks

### useHomePageListings

Custom hook for managing view state and logic.

**Parameters:**

- `initialView`: Initial view type (default: 'standings')

**Returns:**

- `activeView`: Current active view
- `handleViewChange`: Function to change view
- `toggleView`: Function to toggle between views

### useStandingsData

Hook for fetching standings data using cached store data and tRPC queries.

**Returns:**

- `data`: Standings data or null
- `isLoading`: Loading state
- `error`: Error state
- `refetch`: Function to refetch data

### useLeaderboardData

Hook for fetching leaderboard data using cached store data and tRPC queries.

**Returns:**

- `data`: Leaderboard data or null
- `isLoading`: Loading state
- `error`: Error state
- `refetch`: Function to refetch data

## Utils

### transformTourCardsForStandings

Transforms tour cards data for standings view display.

### transformLeaderboardTeams

Transforms leaderboard teams data for leaderboard view display.

### getTourLink

Generates appropriate links based on view type.

### getTourAriaLabel

Generates appropriate aria labels for accessibility.

### getUserHighlightStatus

Determines if a user should be highlighted as friend or self.

## Types

All TypeScript types are exported from the main index file:

- `HomePageListingsUser`
- `HomePageListingsTour`
- `HomePageListingsChampion`
- `HomePageListingsTeam`
- `HomePageListingsTourCard`
- `HomePageListingsLeaderboardTeam`
- `HomePageListingsLeaderboardTour`
- `HomePageListingsTournament`
- `HomePageListingsViewType`
- `HomePageListingsStandingsProps`
- `HomePageListingsLeaderboardProps`
- `HomePageListingsContainerProps`
- `HomePageListingsToggleProps`

## Features

- **Automatic Data Fetching**: Built-in data fetching using cached store data and tRPC queries
- **Toggle Functionality**: Switch between standings and leaderboard views
- **Responsive Design**: Works on all screen sizes
- **Type Safety**: Full TypeScript support
- **Accessibility**: Proper ARIA labels and keyboard navigation
- **Performance**: Optimized data transformation utilities
- **Reusability**: Modular component structure
- **Extensibility**: Easy to add new view types in the future
- **Loading States**: Proper loading and error handling
- **Backward Compatibility**: Maintains existing API
