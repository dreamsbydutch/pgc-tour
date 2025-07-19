# LeaderboardView Component Structure

This document outlines the refactored structure of the LeaderboardView component, organized for maximum maintainability and reusability.

## 📁 Folder Structure

```
LeaderboardView/
├── main.tsx                 # Main orchestrating component
├── utils/                   # Pure utility functions, types, and constants
│   ├── index.ts            # Export all utilities
│   ├── leaderboard-utils.ts # Core utility functions
│   ├── types.ts            # TypeScript type definitions
│   └── constants.tsx       # Constants and configurations
├── hooks/                  # Custom hooks for data and logic
│   ├── useLeaderboardData.ts # Data fetching hook
│   └── useLeaderboardLogic.ts # Business logic hook
└── components/             # Pure functional UI components
    ├── index.ts           # Export all components
    ├── PGCLeaderboard.tsx # PGC teams leaderboard
    ├── PGALeaderboard.tsx # PGA golfers leaderboard
    ├── LeaderboardListing.tsx # Individual row component
    ├── UIComponents.tsx   # Small UI elements
    ├── ScoreDisplay.tsx   # Score formatting component
    └── TableComponents.tsx # Table-related components
```

## 🎯 Component Architecture

### Main Component (`main.tsx`)

- **Purpose**: Orchestrates the entire leaderboard
- **Responsibilities**:
  - Fetches data using hooks
  - Manages active tour state
  - Renders child components
  - Handles loading/error states

### Utils Folder

- **Purpose**: Pure functions, types, and constants
- **Characteristics**:
  - No side effects
  - Fully testable
  - Reusable across components
  - Properly typed with JSDoc comments

### Hooks Folder

- **Purpose**: Custom hooks for data fetching and business logic
- **Characteristics**:
  - Return data with loading/error states
  - Encapsulate complex logic
  - Reusable across components
  - Properly typed return values

### Components Folder

- **Purpose**: Pure functional UI components
- **Characteristics**:
  - Only accept props and render UI
  - No side effects or data fetching
  - Composable and reusable
  - Clear prop interfaces

## 🔧 Key Features

### Type Safety

- Discriminated unions for component variants
- Comprehensive TypeScript interfaces
- JSDoc comments for IntelliSense

### Error Handling

- Comprehensive error states
- Loading indicators
- Retry functionality

### Performance

- Memoized calculations
- Efficient sorting algorithms
- Minimal re-renders

### Maintainability

- Clear separation of concerns
- Well-documented functions
- Consistent naming conventions
- Modular architecture

## 📝 Usage Example

```tsx
import { LeaderboardView } from './LeaderboardView/main';

// Basic usage
<LeaderboardView
  tournamentId="tournament-123"
  variant="regular"
/>

// With user personalization
<LeaderboardView
  tournamentId="tournament-123"
  variant="playoff"
  userId="user-456"
  inputTour="gold"
  onRefetch={() => console.log('Data refreshed')}
/>
```

## 🚀 Benefits of This Structure

1. **Separation of Concerns**: Each folder has a clear responsibility
2. **Testability**: Pure functions and components are easy to test
3. **Reusability**: Components and utilities can be reused
4. **Type Safety**: Comprehensive TypeScript coverage
5. **Performance**: Optimized hooks and memoization
6. **Maintainability**: Well-organized and documented code
7. **IntelliSense**: Rich IDE support with JSDoc comments
