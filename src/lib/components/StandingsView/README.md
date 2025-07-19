# StandingsView Component Structure

This document outlines the refactored structure of the StandingsView component, organized for maximum maintainability and reusability following the same patterns as LeaderboardView.

## 📁 Folder Structure

```
StandingsView/
├── main.tsx                     # Main orchestrating component
├── index.ts                    # Main export file
├── utils/                      # Pure utility functions, types, and constants
│   ├── index.ts               # Export all utilities
│   ├── standings-utils.ts     # Core utility functions
│   ├── types.ts              # TypeScript type definitions
│   └── constants.ts          # Constants and configurations
├── hooks/                     # Custom hooks for data and logic
│   ├── index.ts              # Export all hooks
│   ├── useStandingsData.ts   # Data fetching hook
│   └── useFriendManagement.ts # Friend management hook
└── components/               # Pure functional UI components
    ├── index.ts             # Export all components
    ├── StandingsContent.tsx # Content router component
    ├── TourStandings.tsx   # Regular tour standings
    ├── PlayoffStandings.tsx # Playoff standings
    ├── StandingsListing.tsx # Individual row component
    ├── StandingsHeader.tsx # Header component
    ├── ToursToggle.tsx     # Tour selection toggle
    ├── StandingsTableHeader.tsx # Table header
    ├── StandingsTourCardInfo.tsx # Tour card info
    ├── PointsAndPayoutsPopover.tsx # Points popover
    ├── StandingsLoadingSkeleton.tsx # Loading skeleton
    └── StandingsError.tsx  # Error state component
```

## 🎯 Component Architecture

### Main Component (`main.tsx`)

- **Purpose**: Orchestrates the entire standings view
- **Responsibilities**:
  - Fetches data using custom hooks
  - Manages tour selection state
  - Handles friend management
  - Renders child components based on state
  - Handles loading/error states

### Utils Folder

- **Purpose**: Pure functions, types, and constants
- **Key Features**:
  - **standings-utils.ts**: Core utilities for:
    - Position parsing and formatting
    - Grouping tour cards by playoff status
    - Sorting and filtering functions
    - Position change calculations
    - Styling helpers
  - **types.ts**: Comprehensive TypeScript definitions
  - **constants.ts**: Configuration constants and thresholds

### Hooks Folder

- **Purpose**: Custom hooks for data fetching and business logic
- **Key Hooks**:
  - **useStandingsData**: Fetches and processes all standings data
  - **useFriendManagement**: Handles friend add/remove operations

### Components Folder

- **Purpose**: Pure functional UI components
- **Key Components**:
  - **StandingsContent**: Routes between different view types
  - **TourStandings**: Displays regular season standings
  - **PlayoffStandings**: Shows playoff qualification status
  - **StandingsListing**: Individual player row
  - **ToursToggle**: Tour selection interface

## 🔧 Key Features

### Standings Types

- **Regular Tour Standings**: Shows current season points with playoff cut lines
- **Playoff Standings**: Groups players by qualification status (Gold/Silver/Bumped)

### Friend Management

- Optimistic updates for adding/removing friends
- Loading states for friend operations
- Visual indicators for friend status

### Data Processing

- Position parsing from various formats ("T15", 12, "1")
- Automatic grouping by playoff qualification
- Real-time position change calculations

### Responsive Design

- Mobile-optimized table layouts
- Progressive disclosure of information
- Touch-friendly interactions

## 🎨 Visual Features

### Cut Line Indicators

- **Gold Playoff Line**: Positions 1-15
- **Silver Playoff Line**: Positions 16-35
- Color-coded visual separators

### Position Changes

- Up/down/neutral indicators
- Color-coded change values
- Historical position tracking

### User Highlighting

- Current user's row highlighted
- Friends' rows visually distinguished
- Interactive friend management buttons

## 📝 Usage Examples

```tsx
import { StandingsView } from './StandingsView';

// Basic usage
<StandingsView />

// With initial tour selection
<StandingsView initialTourId="gold-tour" />
```

## 🚀 Benefits of This Structure

1. **Separation of Concerns**: Clear responsibility boundaries
2. **Type Safety**: Comprehensive TypeScript coverage
3. **Performance**: Optimized hooks and memoization
4. **Maintainability**: Well-organized and documented code
5. **Reusability**: Modular components and utilities
6. **Friend Management**: Seamless social features
7. **Responsive**: Works across all device sizes
8. **Error Handling**: Comprehensive error states
9. **Loading States**: Skeleton loading for better UX
10. **Accessibility**: Screen reader friendly components

## 🔄 Data Flow

1. **Data Fetching**: `useStandingsData` fetches and processes all data
2. **Friend Management**: `useFriendManagement` handles social features
3. **State Management**: Main component manages tour selection
4. **Content Routing**: `StandingsContent` routes to appropriate view
5. **Data Display**: Specialized components render different standings types

This structure ensures a maintainable, scalable, and user-friendly standings experience!
